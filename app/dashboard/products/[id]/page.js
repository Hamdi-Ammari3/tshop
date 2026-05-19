"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {useParams,useRouter} from "next/navigation";
import {doc,getDoc,updateDoc,serverTimestamp} from "firebase/firestore";
import {DB} from "../../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../../lib/uploadToCloudinary";
import {FiArrowLeft,FiUpload,FiX,FiStar,FiSave,FiAlertCircle} from "react-icons/fi";
import "./editProduct.css";

export default function EditProductPage() {

  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hasDiscount,setHasDiscount] = useState(false);
  const [discountedPrice,setDiscountedPrice] = useState("");
  const [images, setImages] = useState([]);
  const [toast, setToast] = useState(null);
  const [storeId, setStoreId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex,setCurrentUploadIndex] = useState(0);

  const categories = [
  {
    slug: "mode",
    label: "Mode",
  },
  {
    slug: "beaute-bien-etre",
    label: "Beauté & Bien-être",
  },
  {
    slug: "electronique",
    label: "Électronique",
  },
  {
    slug: "maison-cuisine",
    label: "Maison & Cuisine",
  },
  {
    slug: "meubles",
    label: "Meubles",
  },
  {
    slug: "telephones-accessoires",
    label: "Téléphones & Accessoires",
  },
  {
    slug: "sport-fitness",
    label: "Sport & Fitness",
  },
  {
    slug: "bijoux-montres",
    label: "Bijoux & Montres",
  },
  {
    slug: "sacs-accessoires",
    label: "Sacs & Accessoires",
  },
  {
    slug: "jeux-gaming",
    label: "Jeux & Gaming",
  },
  {
    slug: "bebe-enfants",
    label: "Bébé & Enfants",
  },
  {
    slug: "automobile",
    label: "Automobile",
  },
  {
    slug: "livres-fournitures",
    label: "Livres & Fournitures",
  },
  {
    slug: "animalerie",
    label: "Animalerie",
  },
  {
    slug: "autre",
    label: "Autre",
  },
];

  /* TOAST */
  const showToast = (message,type = "error") => {
    setToast({message,type});

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /* FETCH PRODUCT */
  useEffect(() => {

    async function fetchProduct() {

      try {

        const productRef = doc(DB,"products",productId);

        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          showToast("Produit introuvable.");
          return;
        }

        const data = productSnap.data();

        setStoreId(data.storeId || "");
        setName(data.name || "");

        const matchedCategory = categories.find((cat) => cat.slug === data.category_slug);
        setCategory(matchedCategory || null);

        setDescription(data.description || "");
        setHasDiscount(data.hasDiscount || false);

        /* CONSISTENT PRICE LOGIC */
        if (data.hasDiscount) {
          setPrice(data.oldPrice?.toString() || "");
          setDiscountedPrice(data.price?.toString() || "");
        } else {
          setPrice(data.price?.toString() || "");
          setDiscountedPrice("");
        }

        setImages(
  (data.images || []).map(
    (url) => ({
      id: crypto.randomUUID(),
      preview: url,
      existing: true,
      status: "ready",
      retrying: false,
      error: null,
    })
  )
);

      } catch (error) {

        console.log(error);

        showToast(
          "Impossible de charger le produit."
        );

      } finally {

        setLoading(false);

      }

    }

    fetchProduct();

  }, [productId]);

  
  /* CLEANUP */
useEffect(() => {

  return () => {

    images.forEach((img) => {

      if (
        !img.existing &&
        img.preview?.startsWith(
          "blob:"
        )
      ) {

        URL.revokeObjectURL(
          img.preview
        );

      }

    });

  };

}, [images]);

const handleFiles = (files) => {

  if (!files || files.length === 0) {
    return;
  }

  const selectedFiles =
    Array.from(files);

  setImages((prev) => {

    const currentCount =
      prev.length;

    if (currentCount >= 10) {

      showToast(
        "Maximum 10 images atteint."
      );

      return prev;

    }

    const remainingSlots =
      10 - currentCount;

    const allowedFiles =
      selectedFiles.slice(
        0,
        remainingSlots
      );

    const validImages = [];

    for (const file of allowedFiles) {

      /*
      ONLY CHECK IMAGE TYPE
      */
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        continue;

      }

      /*
      PREVENT DUPLICATES
      */
      const alreadyExists =
        prev.some(
          (img) =>
            img.file?.name ===
              file.name &&
            img.file?.size ===
              file.size
        );

      if (alreadyExists) {
        continue;
      }

      const preview =
        URL.createObjectURL(
          file
        );

      validImages.push({

        id:
          crypto.randomUUID(),

        file,

        preview,

        existing: false,

      });

    }

    return [
      ...prev,
      ...validImages,
    ];

  });

};

  const removeImage = (index) => {

  setImages((prev) => {

    const imageToRemove =
      prev[index];

    if (
      !imageToRemove?.existing &&
      imageToRemove?.preview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        imageToRemove.preview
      );

    }

    return prev.filter(
      (_, i) => i !== index
    );

  });

};

  /* THUMBNAIL */
  const makeThumbnail = (index) => {

    setImages((prev) => {

      const copy = [...prev];

      const [selected] =
        copy.splice(index, 1);

      copy.unshift(selected);

      return copy;

    });

  };

  /* SUBMIT */
  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (saving) return;

    /* IMAGES */
    if (images.length === 0) {
      showToast("Veuillez ajouter des images.");
      return;

    }

    /* NAME */
    if (!name.trim()) {
      showToast("Veuillez saisir le nom du produit.");
      return;
    }

    /* CATEGORY */
    if (!category) {
      showToast("Veuillez choisir une catégorie.");
      return;
    }

    /* PRICE */
    if (!price ||Number(price) <= 0) {
      showToast("Le prix doit être supérieur à 0.");
      return;
    }

    /* DISCOUNT */
    if (hasDiscount) {
      if (!discountedPrice ||Number(discountedPrice) <= 0) {
        showToast("Veuillez saisir le prix promotionnel.");
        return;
      }

      if (Number(discountedPrice) >= Number(price)) {
        showToast("Le prix promotionnel doit être inférieur au prix original.");
        return;
      }

    }

    /* DESCRIPTION */
    if (!description.trim()) {
      showToast("Veuillez saisir une description.");
      return;
    }

    try {

      setSaving(true);

      const uploadedImages = [];

for (
  let i = 0;
  i < images.length;
  i++
) {

  const image =
    images[i];

  /*
  EXISTING IMAGE
  */
  if (image.existing) {

    uploadedImages.push(
      image.preview
    );

    continue;

  }

  setCurrentUploadIndex(
    i + 1
  );

  try {

    const url =
      await uploadToCloudinary(
        image.file,
        (percent) => {

          const totalProgress =
            (
              (
                i +
                percent / 100
              ) /
              images.length
            ) * 100;

          setUploadProgress(
            Math.round(
              totalProgress
            )
          );

        }
      );

    const webpUrl =
      url.replace(
        "/upload/",
        "/upload/f_webp,q_auto,w_1200/"
      );

    uploadedImages.push(
      webpUrl
    );

  } catch (error) {

    console.log(
      "IMAGE UPLOAD ERROR:",
      error
    );

  }

}

if (
  uploadedImages.length === 0
) {

  showToast(
    "Impossible d'envoyer les images."
  );

  setSaving(false);

  return;

}

      /* UPDATE PRODUCT */
      await updateDoc(
        doc(DB,"products",productId),{
          name: name.trim(),
          category: category.label,
          category_slug: category.slug,
          description: description.trim(),
          price: hasDiscount ? Number(discountedPrice) : Number(price),
          oldPrice: hasDiscount ? Number(price) : null,
          hasDiscount,
          images: uploadedImages,
          thumbnail: uploadedImages[0],
          updatedAt: serverTimestamp(),
        }
      );

      router.push("/dashboard/products");

    } catch (error) {

      console.log(error);

      showToast(
        "Une erreur est survenue."
      );

    } finally {
      setSaving(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }

  };

  /* LOADING */
  if (loading) {

    return (

      <div className="edit-loading">

        Chargement du produit...

      </div>

    );

  }

  return (
    <div className="edit-product-page">

      {/* BACK */}
      <Link
        href="/dashboard/products"
        className="back-btn"
      >

        <FiArrowLeft />

        Retour aux produits

      </Link>

      {/* HEADER */}
      <h1 className="edit-title">

        Modifier le produit

      </h1>

      <p className="edit-desc">

        Mettez à jour les informations
        de votre produit.

      </p>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="product-form"
      >

        {/* IMAGES */}
        <div className="form-group">

          <label>
            Images
          </label>

          <p className="form-helper">

            La première image sera
            utilisée comme miniature.

          </p>

          <div className="images-grid">

              {images.map(
  (img, index) => (

    <div
      key={img.id}
      className="image-card"
    >

      <img
        src={img.preview}
        alt="Produit"
        loading="lazy"
        className="preview-image"
      />

      {index === 0 && (

        <span className="thumbnail-badge">

          Miniature

        </span>

      )}

      <div className="image-overlay">

        {index !== 0 && (

          <button
            type="button"
            onClick={() =>
              makeThumbnail(index)
            }
            className="image-action"
          >

            <FiStar />

          </button>

        )}

        <button
          type="button"
          onClick={() =>
            removeImage(index)
          }
          className="image-action delete"
        >

          <FiX />

        </button>

      </div>

    </div>

  )
)}

            {/* UPLOAD */}
            {images.length < 10 && (

              <label className="upload-box">

                <FiUpload />

                <span>
                  Ajouter
                </span>

                <small>
                  Max 10 images
                </small>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

              </label>

            )}

          </div>

        </div>

        {/* NAME */}
        <div className="form-group">

          <label>
            Nom du produit
          </label>

          <input
            type="text"
            value={name}
            maxLength={120}
            placeholder="Ex : Sac en cuir"
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

        </div>

        {/* GRID */}
        <div className="form-row">

          {/* CATEGORY */}
          <div className="form-group">

            <label>
              Catégorie
            </label>

            <select
              value={category?.slug || ""}
              onChange={(e) => {
                const selectedCategory = categories.find((cat) =>cat.slug === e.target.value);
                setCategory(selectedCategory);
              }}
            >
              <option value="">
                Sélectionner
              </option>

              {categories.map((cat) => (
                <option
                  key={cat.slug}
                  value={cat.slug}
                >
                  {cat.label}
                </option>
              ))}
            </select>

          </div>

          {/* PRICE */}
          <div className="form-group">

            <label>
              Prix (DT)
            </label>

            <input
              type="number"
              min="0"
              //step="0.001"
              placeholder="0.000"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* DISCOUNT */}
        <div className="discount-box">

          <div className="discount-top">

            <div>

              <label>
                Produit en promotion
              </label>

              <p>

                Activez un prix
                promotionnel.

              </p>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={() => {

                  const newValue =
                    !hasDiscount;

                  setHasDiscount(
                    newValue
                  );

                  if (!newValue) {

                    setDiscountedPrice("");

                  }

                }}
              />

              <span className="slider"></span>

            </label>

          </div>

          {hasDiscount && (

            <div className="discount-grid">

              <div className="form-group">

                <label>
                  Prix original
                </label>

                <input
                  type="number"
                  min="0"
                  //step="0.001"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Prix promotionnel
                </label>

                <input
                  type="number"
                  min="0"
                  //step="0.001"
                  value={discountedPrice}
                  onChange={(e) =>
                    setDiscountedPrice(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          )}

        </div>

        {/* DESCRIPTION */}
        <div className="form-group">

          <label>
            Description
          </label>

          <textarea
            rows="5"
            maxLength={3000}
            placeholder="Décrivez votre produit..."
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

        </div>

        {/* TOAST */}
        {toast && (

          <div
            className={`checkout-toast ${toast.type}`}
          >

            <div className="toast-left">

              <div className="toast-icon">

                <FiAlertCircle />

              </div>

              <p>
                {toast.message}
              </p>

            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() =>
                setToast(null)
              }
            >

              <FiX />

            </button>

          </div>

        )}

        {saving && (

  <div className="upload-progress-box">

    <div className="upload-progress-top">

      <span>
        Upload des images...
      </span>

      <span>
        {uploadProgress}%
      </span>

    </div>

    <div className="upload-progress-bar">

      <div
        className="upload-progress-fill"
        style={{
          width: `${uploadProgress}%`,
        }}
      />

    </div>

    <p>

      Image
      {" "}
      {currentUploadIndex}
      {" / "}
      {images.length}

    </p>

  </div>

)}

        {/* ACTIONS */}
        <div className="form-actions">

          <Link
            href="/dashboard/products"
            className="cancel-btn"
          >

            Annuler

          </Link>

          <button
            type="submit"
            className="save-btn"
            disabled={saving}
          >

            {saving ? (
              <>
                <span className="btn-spinner"></span>
                Enregistrement...
              </>
            ) : (
              <>
                <FiSave />
                Enregistrer
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );

}