/*
"use client";

import { useEffect, useState,useRef } from "react";
import { useRouter } from "next/navigation";
import {collection,addDoc,serverTimestamp} from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../../lib/uploadToCloudinary";
import {useStore} from "../../../../context/StoreContext";
import Link from "next/link";
import {FiArrowLeft,FiUpload,FiX,FiStar,FiAlertCircle} from "react-icons/fi";
import "./newProduct.css";

export default function NewProductPage() {

  const router = useRouter();
  const { store } = useStore();
  const imagesRef = useRef([]);

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

  //FORMAT PRICE
  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "fr-TN",
      {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }
    ).format(Number(price || 0));
  };

  //TOAST 
  const showToast = (message,type = "error") => {
    setToast({message,type});

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

    let failedCount = 0;

    for (const file of allowedFiles) {

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        failedCount++;
        continue;
      }

      if (
        file.size >
        15 * 1024 * 1024
      ) {

        failedCount++;
        continue;
      }

      const alreadyExists =
        prev.some(
          (img) =>
            img.file.name ===
              file.name &&
            img.file.size ===
              file.size
        );

      if (alreadyExists) {
        continue;
      }

      try {

        const preview =
          URL.createObjectURL(
            file
          );

        validImages.push({
          id:
            crypto.randomUUID(),
          file,
          preview,

          status: "loading",

          error: null,
          retrying: false,
        });

      } catch (error) {

        console.log(error);

        failedCount++;
      }
    }

    if (failedCount > 0) {

      showToast(
        "Certaines images n'ont pas pu être chargées. Essayez une autre photo."
      );

    }

    return [
      ...prev,
      ...validImages,
    ];
  });
};

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {

  return () => {

    imagesRef.current.forEach((img) => {

      if (
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

}, []);

 const removeImage = (index) => {
  setImages((prev) => {
    const imageToRemove = prev[index];
    // Only revoke if it's a blob URL
    if (imageToRemove?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    return prev.filter((_, i) => i !== index);
  });
};

  //THUMBNAIL
  const makeThumbnail = (index) => {

    setImages((prev) => {

      const copy = [...prev];

      const [selected] =
        copy.splice(index, 1);

      copy.unshift(selected);

      return copy;

    });

  };

  //SUBMIT 
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) return;

    if (images.length === 0) {

      showToast(
        "Veuillez ajouter des images."
      );

      return;
    }

    if (!name.trim()) {
      showToast("Veuillez saisir le nom du produit.");
      return;
    }

    if (!category) {
      showToast("Veuillez choisir une catégorie.");
      return;
    }

    if (!price || Number(price) <= 0) {
      showToast("Le prix doit être supérieur à 0.");
      return;
    }


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

    if (!description.trim()) {
      showToast("Veuillez saisir une description.");
      return;
    }

    try {

      setLoading(true);

      const uploadedImages = [];

const validUploadImages =
  images.filter(
    (img) =>
      img.status !== "failed"
  );

if (
  validUploadImages.length === 0
) {

  showToast(
    "Aucune image valide."
  );

  setLoading(false);

  return;
}

for (
  let i = 0;
  i < validUploadImages.length;
  i++
) {

  const image =
    validUploadImages[i];

  setCurrentUploadIndex(
    i + 1
  );

  try {

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? {
              ...img,
              status:
                "uploading",
            }
          : img
      )
    );

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
              validUploadImages.length
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

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? {
              ...img,
              status:
                "uploaded",
            }
          : img
      )
    );

  } catch (error) {

    console.log(error);

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? {
              ...img,
              status:
                "failed",

              error:
                "Échec upload",
            }
          : img
      )
    );
  }
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

      <Link
        href="/dashboard/products"
        className="back-products"
      >

        <FiArrowLeft />

        Retour aux produits

      </Link>

      <div className="new-product-header">

        <h1>
          Ajouter un produit
        </h1>

        <p>
          Ajoutez un nouvel article
          à votre boutique.
        </p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="product-form"
      >

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
  className={`image-preview ${
    image.status === "failed"
      ? "image-preview-failed"
      : ""
  }`}
>

  {image.status === "loading" && (

    <div className="image-loading">

      <div className="image-loading-spinner"></div>

    </div>

  )}

<img
  src={image.preview}
  alt="Preview"
  loading="lazy"
  className="preview-image"

  onLoad={() => {

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? {
              ...img,
              status: "ready",
            }
          : img
      )
    );

  }}

  onError={(e) => {
    if (image.retrying) {
      return;
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? {
              ...img,
              retrying: true,
            }
          : img
      )
    );

    setTimeout(() => {

      e.target.src =
        image.preview +
        "#" +
        Date.now();

      setTimeout(() => {

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,

                  retrying: false,

                  status:
                    img.status === "ready"
                      ? "ready"
                      : "failed",

                  error:
                    img.status === "ready"
                      ? null
                      : "Image incompatible",
                }
              : img
          )
        );

      }, 1200);

    }, 500);

  }}
/>

  {image.status === "failed" && (

    <div className="image-error-overlay">

      <FiAlertCircle />

      <p>
        Image non compatible
      </p>

      <small>
        Essayez une autre photo
      </small>

      <button
        type="button"
        onClick={() =>
          removeImage(index)
        }
      >

        Supprimer

      </button>

    </div>

  )}

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
                    e.target.value = ""
                  }}
                />

              </label>
            )}

          </div>

        </div>

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

        <div className="double-grid">

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
*/


"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../../lib/uploadToCloudinary";
import { useStore } from "../../../../context/StoreContext";
import Link from "next/link";
import { FiArrowLeft, FiUpload, FiX, FiStar, FiAlertCircle } from "react-icons/fi";
import "./newProduct.css";

export default function NewProductPage() {

  const router = useRouter();
  const { store } = useStore();
  const imagesRef = useRef([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [toast, setToast] = useState(null);

  const categories = [
    { slug: "mode", label: "Mode" },
    { slug: "beaute-bien-etre", label: "Beauté & Bien-être" },
    { slug: "electronique", label: "Électronique" },
    { slug: "maison-cuisine", label: "Maison & Cuisine" },
    { slug: "meubles", label: "Meubles" },
    { slug: "telephones-accessoires", label: "Téléphones & Accessoires" },
    { slug: "sport-fitness", label: "Sport & Fitness" },
    { slug: "bijoux-montres", label: "Bijoux & Montres" },
    { slug: "sacs-accessoires", label: "Sacs & Accessoires" },
    { slug: "jeux-gaming", label: "Jeux & Gaming" },
    { slug: "bebe-enfants", label: "Bébé & Enfants" },
    { slug: "automobile", label: "Automobile" },
    { slug: "livres-fournitures", label: "Livres & Fournitures" },
    { slug: "animalerie", label: "Animalerie" },
    { slug: "autre", label: "Autre" },
  ];

  /* FORMAT PRICE */
  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-TN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(Number(price || 0));
  };

  /* TOAST */
  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* KEEP REF IN SYNC — no state mutation to read count */
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  /* CLEANUP ON UNMOUNT */
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  /* READ FILE AS BASE64 — reliable on all mobile browsers */
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result);
        } else {
          reject(new Error("Empty result"));
        }
      };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.onabort = () => reject(new Error("FileReader aborted"));
      reader.readAsDataURL(file);
    });
  };

  /* HANDLE FILES */
  const handleFiles = async (files) => {

    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    // READ FROM REF — zero side effects, no re-render
    const currentCount = imagesRef.current.length;

    if (currentCount >= 10) {
      showToast("Maximum 10 images atteint.");
      return;
    }

    // VALIDATE
    const validFiles = [];

    for (const file of selectedFiles) {

      if (!file.type.startsWith("image/")) {
        showToast("Veuillez sélectionner uniquement des images.");
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        showToast(`"${file.name}" est trop volumineuse (max 15MB).`);
        continue;
      }

      // SKIP DUPLICATES
      const alreadyExists = imagesRef.current.some(
        (img) => img.file.name === file.name && img.file.size === file.size
      );

      if (alreadyExists) continue;

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // RESPECT 10 IMAGE LIMIT
    const allowedFiles = validFiles.slice(0, 10 - currentCount);

    if (allowedFiles.length < validFiles.length) {
      showToast(`Seulement ${allowedFiles.length} image(s) ajoutée(s) (maximum 10).`);
    }

    // PROCESS ALL IN PARALLEL WITH BASE64 — works on all devices
    const results = await Promise.allSettled(
      allowedFiles.map(async (file) => {
        const preview = await readFileAsDataURL(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview, // base64 — never breaks on mobile
        };
      })
    );

    const processedImages = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (failedCount > 0) {
      showToast(`${failedCount} image(s) n'ont pas pu être chargées.`);
    }

    if (processedImages.length === 0) return;

    // SINGLE ATOMIC STATE UPDATE
    setImages((prev) => [...prev, ...processedImages]);

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

  /* SET AS THUMBNAIL */
  const makeThumbnail = (index) => {
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {

    e.preventDefault();
    if (loading) return;

    if (images.length === 0) {
      showToast("Veuillez ajouter des images.");
      return;
    }

    if (!name.trim()) {
      showToast("Veuillez saisir le nom du produit.");
      return;
    }

    if (!category) {
      showToast("Veuillez choisir une catégorie.");
      return;
    }

    if (!price || Number(price) <= 0) {
      showToast("Le prix doit être supérieur à 0.");
      return;
    }

    if (hasDiscount) {
      if (!discountedPrice || Number(discountedPrice) <= 0) {
        showToast("Veuillez saisir le prix promotionnel.");
        return;
      }
      if (Number(discountedPrice) >= Number(price)) {
        showToast("Le prix promotionnel doit être inférieur au prix original.");
        return;
      }
    }

    if (!description.trim()) {
      showToast("Veuillez saisir une description.");
      return;
    }

    try {

      setLoading(true);

      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {

        const image = images[i];
        setCurrentUploadIndex(i + 1);

        const url = await uploadToCloudinary(
          image.file,
          (percent) => {
            const totalProgress = ((i + percent / 100) / images.length) * 100;
            setUploadProgress(Math.round(totalProgress));
          }
        );

        const webpUrl = url.replace(
          "/upload/",
          "/upload/f_webp,q_auto,w_1200/"
        );

        uploadedImages.push(webpUrl);
      }

      await addDoc(collection(DB, "products"), {
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
        stats: { ordersCount: 0, weeklyOrders: 0, views: 0, favorites: 0 },
        rating: { average: 0, count: 0, total: 0 },
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/dashboard/products");

    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      showToast(error?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  return (
    <div className="new-product-page">

      <Link href="/dashboard/products" className="back-products">
        <FiArrowLeft />
        Retour aux produits
      </Link>

      <div className="new-product-header">
        <h1>Ajouter un produit</h1>
        <p>Ajoutez un nouvel article à votre boutique.</p>
      </div>

      <form onSubmit={handleSubmit} className="product-form">

        {/* IMAGES */}
        <div className="form-group">

          <label>Images</label>

          <span className="form-helper">
            La première image sera utilisée comme miniature.
          </span>

          <div className="images-grid">

            {images.map((image, index) => (

              <div key={image.id} className="image-preview">

                <img
                  src={image.preview}
                  alt="Preview"
                  className="preview-image"
                />

                {index === 0 && (
                  <span className="thumbnail-badge">Miniature</span>
                )}

                <div className="image-overlay">

                  {index !== 0 ? (
                    <button type="button" onClick={() => makeThumbnail(index)}>
                      <FiStar />
                    </button>
                  ) : (
                    <span></span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-btn"
                  >
                    <FiX />
                  </button>

                </div>

              </div>

            ))}

            {images.length < 10 && (
              <label className="upload-box">
                <FiUpload />
                <span>Ajouter</span>
                <small>Max 10 images</small>
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
          <label>Nom du produit</label>
          <input
            type="text"
            placeholder="Ex : Sac en cuir"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value.trimStart())}
          />
        </div>

        {/* CATEGORY + PRICE */}
        <div className="double-grid">

          <div className="form-group">
            <label>Catégorie</label>
            <select
              value={category?.slug || ""}
              onChange={(e) => {
                const selected = categories.find((c) => c.slug === e.target.value);
                setCategory(selected);
              }}
            >
              <option value="">Sélectionner</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Prix (DT)</label>
            <input
              type="number"
              min="0"
              placeholder="0.000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

        </div>

        {/* DISCOUNT */}
        <div className="discount-box">

          <div className="discount-top">
            <div>
              <h4>Produit en promotion</h4>
              <p>Activez un prix promotionnel.</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={() => setHasDiscount(!hasDiscount)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {hasDiscount && (
            <div className="discount-grid">
              <div className="form-group">
                <label>Prix original</label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Prix promotionnel</label>
                <input
                  type="number"
                  min="0"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                />
              </div>
            </div>
          )}

        </div>

        {/* SHIPPING */}
        <div className="shipping-box">
          <div className="shipping-top">
            <div>
              <h4>Frais de livraison</h4>
              <p>
                Les clients paieront
                <strong> {formatPrice(store?.shipping_fee || 8)} DT </strong>
                pour la livraison.
              </p>
            </div>
            <Link href="/dashboard/settings" className="shipping-settings-btn">
              Modifier
            </Link>
          </div>
          <div className="shipping-note">
            Les frais de livraison sont configurés globalement depuis les paramètres de votre boutique.
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label>Description</label>
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
          <div className={`checkout-toast ${toast.type}`}>
            <div className="toast-left">
              <div className="toast-icon"><FiAlertCircle /></div>
              <p>{toast.message}</p>
            </div>
            <button className="toast-close" onClick={() => setToast(null)}>
              <FiX />
            </button>
          </div>
        )}

        {/* UPLOAD PROGRESS */}
        {loading && (
          <div className="upload-progress-box">
            <div className="upload-progress-top">
              <span>Upload des images...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>Image {currentUploadIndex} / {images.length}</p>
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

          <button type="submit" className="save-btn" disabled={loading}>
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

