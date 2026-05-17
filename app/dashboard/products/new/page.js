"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {collection,addDoc,serverTimestamp} from "firebase/firestore";
import {ref,uploadBytesResumable,getDownloadURL} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { DB,storage } from "../../../../lib/firebaseConfig";
import {useStore} from "../../../../context/StoreContext";
import Link from "next/link";
import {FiArrowLeft,FiUpload,FiX,FiStar,FiAlertCircle} from "react-icons/fi";
import "./newProduct.css";

export default function NewProductPage() {

  const router = useRouter();
  const { store } = useStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice,setDiscountedPrice] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex,setCurrentUploadIndex] = useState(0);
  const [toast, setToast] = useState(null);

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

  /* FORMAT PRICE */
  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "fr-TN",
      {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }
    ).format(Number(price || 0));
  };

  /* TOAST */
  const showToast = (message,type = "error") => {
    setToast({message,type});

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /* CLEANUP */
  useEffect(() => {

  return () => {

    images.forEach((img) => {

      if (
        img.preview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          img.preview
        );
      }

    });

  };

}, []);

  const handleFiles = async (files) => {

  if (!files) return;

  const selectedFiles =
    Array.from(files);

  if (
    images.length +
    selectedFiles.length >
    10
  ) {

    showToast(
      "Maximum 10 images."
    );

    return;
  }

  try {

    const processedImages = [];

    for (const file of selectedFiles) {

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showToast(
          "Veuillez sélectionner uniquement des images."
        );

        continue;
      }

      /*
      MOBILE SAFE: allow larger originals because we compress later
      */
      if (
        file.size >
        15 * 1024 * 1024
      ) {

        showToast(
          "Image trop volumineuse."
        );

        continue;
      }

      //COMPRESS + WEBP
      const compressedFile = await imageCompression(file,
        {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1200,
          useWebWorker: false, 
          //useWebWorker: typeof window !== "undefined" && window.innerWidth > 768,
          //fileType: "image/webp",
          initialQuality: 0.75,
          preserveExif: false,
          alwaysKeepResolution: false,
        }
      );

      processedImages.push({
        id: crypto.randomUUID(),
        file: compressedFile,
        preview:
          URL.createObjectURL(
            compressedFile
          ),
      });

    }

    setImages((prev) => [
      ...prev,
      ...processedImages,
    ]);

  } catch (error) {

    console.log(error);
    showToast(error);
    //alert("Error: " + error?.message + " | " + error?.name);

    //showToast("Erreur lors du traitement des images.",error);

  }

};

  /* REMOVE IMAGE */
  const removeImage = (index) => {

    setImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return prev.filter((_, i) => i !== index);
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
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) return;

    /* IMAGES */
    if (images.length === 0) {

      showToast(
        "Veuillez ajouter des images."
      );

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
    if (!price || Number(price) <= 0) {
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

      setLoading(true);

      const uploadedImages = [];

for (
  let i = 0;
  i < images.length;
  i++
) {

  const image = images[i];

  setCurrentUploadIndex(i + 1);

  const fileName =
    `${Date.now()}-${crypto.randomUUID()}.webp`;

  const storageRef = ref(
    storage,
    `products/${store.id}/${fileName}`
  );

  const uploadTask =
    uploadBytesResumable(
      storageRef,
      image.file,
      {
        contentType:
          "image/webp",
      }
    );

  const downloadURL =
    await new Promise(
      (resolve, reject) => {

        const timeout =
          setTimeout(() => {

            reject(
              new Error(
                "Timeout upload"
              )
            );

          }, 45000);

        uploadTask.on(
          "state_changed",

          (snapshot) => {

            const progress =
              (
                snapshot.bytesTransferred /
                snapshot.totalBytes
              ) * 100;

            /*
            GLOBAL PROGRESS
            */
            const totalProgress =
              (
                (
                  i +
                  progress / 100
                ) /
                images.length
              ) * 100;

            setUploadProgress(
              Math.round(
                totalProgress
              )
            );

          },

          (error) => {

            clearTimeout(
              timeout
            );

            reject(error);

          },

          async () => {

            clearTimeout(
              timeout
            );

            const url =
              await getDownloadURL(
                uploadTask.snapshot.ref
              );

            resolve(url);

          }
        );

      }
    );

  uploadedImages.push(
    downloadURL
  );

}

      await addDoc(collection(DB, "products"),{
          storeId: store.id,
          storeSlug: store.slug,
          storeName: store.name,
          storeLogo: store.logo || "",
          name: name.trim(),
          category: category.label,
          category_slug: category.slug,
          description: description.trim(),
          price: hasDiscount ? Number(discountedPrice) : Number(price),
          oldPrice: hasDiscount ? Number(price) : null,
          hasDiscount,
          images: uploadedImages,
          thumbnail: uploadedImages[0],
          shipping_fee: Number(store?.shipping_fee || 8),
          stats: {
            ordersCount: 0,
            weeklyOrders: 0,
            views: 0,
            favorites: 0,
          },
          rating: {
            average: 0,
            count: 0,
            total: 0,
          },
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      router.push(
        "/dashboard/products"
      );

    } catch (error) {
      console.log("UPLOAD ERROR:",error);
      showToast(error?.message ||"Une erreur est survenue.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  return (
    <div className="new-product-page">

      {/* BACK */}
      <Link
        href="/dashboard/products"
        className="back-products"
      >

        <FiArrowLeft />

        Retour aux produits

      </Link>

      {/* HEADER */}
      <div className="new-product-header">

        <h1>
          Ajouter un produit
        </h1>

        <p>
          Ajoutez un nouvel article
          à votre boutique.
        </p>

      </div>

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

          <span className="form-helper">

            La première image sera
            utilisée comme miniature.

          </span>

          <div className="images-grid">

            {images.map(
              (image, index) => (

                <div
                  key={image.id}
                  className="image-preview"
                >

                  <img
                    src={image.preview}
                    alt="Preview"
                    className="preview-image"
                  />

                  {index === 0 && (

                    <span className="thumbnail-badge">
                      Miniature
                    </span>

                  )}

                  <div className="image-overlay">

                    {index !== 0 ? (

                      <button
                        type="button"
                        onClick={() =>
                          makeThumbnail(index)
                        }
                      >

                        <FiStar />

                      </button>

                    ) : (
                      <span></span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(index)
                      }
                      className="remove-btn"
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
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleFiles(e.target.files); 
                    e.target.value = ""
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
            placeholder="Ex : Sac en cuir"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value.trimStart())}
          />

        </div>

        {/* GRID */}
        <div className="double-grid">

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

              <h4>
                Produit en promotion
              </h4>

              <p>
                Activez un prix
                promotionnel.
              </p>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={() =>
                  setHasDiscount(
                    !hasDiscount
                  )
                }
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

        {/* SHIPPING */}
        <div className="shipping-box">

          <div className="shipping-top">

            <div>

              <h4>
                Frais de livraison
              </h4>

              <p>

                Les clients paieront

                <strong>
                  {" "}
                  {formatPrice(
                    store?.shipping_fee || 8
                  )} DT
                  {" "}
                </strong>

                pour la livraison.

              </p>

            </div>

            <Link
              href="/dashboard/settings"
              className="shipping-settings-btn"
            >

              Modifier

            </Link>

          </div>

          <div className="shipping-note">

            Les frais de livraison sont
            configurés globalement depuis
            les paramètres de votre boutique.

          </div>

        </div>

        {/* DESCRIPTION */}
        <div className="form-group">

          <label>
            Description
          </label>

          <textarea
            rows={5}
            maxLength={3000}
            placeholder="Décrivez votre produit..."
            value={description}
            onChange={(e) => setDescription(e.target.value.trimStart())}
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
              className="toast-close"
              onClick={() =>
                setToast(null)
              }
            >

              <FiX />

            </button>

          </div>

        )}

        {loading && (

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

          <button
            type="button"
            className="cancel-btn"
            disabled={loading}
            onClick={() => {

              setName("");
              setCategory(null);
              setDescription("");
              setPrice("");
              setDiscountedPrice("");
              setHasDiscount(false);
              setImages([]);
              setToast(null);

            }}
          >

            Annuler

          </button>

          <button
            type="submit"
            className="save-btn"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Enregistrement...
              </>
            ) : (
              "Enregistrer le produit"
            )}

          </button>

        </div>

      </form>

    </div>
  );
}