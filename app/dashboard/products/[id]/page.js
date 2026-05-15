"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  DB,
  storage,
} from "../../../../lib/firebaseConfig";

import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiStar,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";

import "./editProduct.css";

export default function EditProductPage() {

  const params = useParams();

  const router = useRouter();

  const productId = params.id;

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [name, setName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [
    hasDiscount,
    setHasDiscount,
  ] = useState(false);

  const [
    discountedPrice,
    setDiscountedPrice,
  ] = useState("");

  const [images, setImages] =
    useState([]);

  const [toast, setToast] =
    useState(null);

  const [storeId, setStoreId] =
    useState("");

  /* FORMAT PRICE */
  const formatPrice = (value) => {

    return new Intl.NumberFormat(
      "fr-TN",
      {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }
    ).format(Number(value || 0));

  };

  /* TOAST */
  const showToast = (
    message,
    type = "error"
  ) => {

    setToast({
      message,
      type,
    });

    setTimeout(() => {

      setToast(null);

    }, 3500);

  };

  /* FETCH PRODUCT */
  useEffect(() => {

    async function fetchProduct() {

      try {

        const productRef = doc(
          DB,
          "products",
          productId
        );

        const productSnap =
          await getDoc(productRef);

        if (!productSnap.exists()) {

          showToast(
            "Produit introuvable."
          );

          return;
        }

        const data =
          productSnap.data();

        setStoreId(
          data.storeId || ""
        );

        setName(
          data.name || ""
        );

        setCategory(
          data.category || ""
        );

        setDescription(
          data.description || ""
        );

        setHasDiscount(
          data.hasDiscount || false
        );

        /* CONSISTENT PRICE LOGIC */
        if (data.hasDiscount) {

          setPrice(
            data.oldPrice?.toString() || ""
          );

          setDiscountedPrice(
            data.price?.toString() || ""
          );

        } else {

          setPrice(
            data.price?.toString() || ""
          );

          setDiscountedPrice("");

        }

        setImages(

          (data.images || []).map(
            (url) => ({
              preview: url,
              existing: true,
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

        if (!img.existing) {

          URL.revokeObjectURL(
            img.preview
          );

        }

      });

    };

  }, [images]);

  /* HANDLE FILES */
  const handleFiles = (files) => {

    if (!files) return;

    const validFiles =
      Array.from(files).filter(
        (file) => {

          if (
            !file.type.startsWith(
              "image/"
            )
          ) {

            showToast(
              "Veuillez sélectionner uniquement des images."
            );

            return false;

          }

          if (
            file.size >
            5 * 1024 * 1024
          ) {

            showToast(
              "Chaque image doit être inférieure à 5 MB."
            );

            return false;

          }

          return true;

        }
      );

    const mapped =
      validFiles.map((file) => ({
        file,
        preview:
          URL.createObjectURL(file),
        existing: false,
      }));

    setImages((prev) => {

      const merged = [
        ...prev,
        ...mapped,
      ];

      return merged.slice(0, 10);

    });

  };

  /* REMOVE IMAGE */
  const removeImage = (index) => {

    setImages((prev) => {

      const imageToRemove =
        prev[index];

      if (
        imageToRemove &&
        !imageToRemove.existing
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

  /* CONVERT WEBP */
  const convertToWebP = async (
    file
  ) => {

    return new Promise(
      (resolve, reject) => {

        const img = new Image();

        img.src =
          URL.createObjectURL(file);

        img.onload = () => {

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = img.width;

          canvas.height =
            img.height;

          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            img,
            0,
            0
          );

          canvas.toBlob(
            (blob) => {

              if (!blob) {

                reject();

                return;

              }

              resolve(blob);

            },
            "image/webp",
            0.82
          );

        };

        img.onerror = reject;

      }
    );

  };

  /* SUBMIT */
  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (saving) return;

    /* IMAGES */
    if (images.length === 0) {

      showToast(
        "Veuillez ajouter des images."
      );

      return;

    }

    /* NAME */
    if (!name.trim()) {

      showToast(
        "Veuillez saisir le nom du produit."
      );

      return;

    }

    /* CATEGORY */
    if (!category.trim()) {

      showToast(
        "Veuillez choisir une catégorie."
      );

      return;

    }

    /* PRICE */
    if (
      !price ||
      Number(price) <= 0
    ) {

      showToast(
        "Le prix doit être supérieur à 0."
      );

      return;

    }

    /* DISCOUNT */
    if (hasDiscount) {

      if (
        !discountedPrice ||
        Number(discountedPrice) <= 0
      ) {

        showToast(
          "Veuillez saisir le prix promotionnel."
        );

        return;

      }

      if (
        Number(discountedPrice) >=
        Number(price)
      ) {

        showToast(
          "Le prix promotionnel doit être inférieur au prix original."
        );

        return;

      }

    }

    /* DESCRIPTION */
    if (!description.trim()) {

      showToast(
        "Veuillez saisir une description."
      );

      return;

    }

    try {

      setSaving(true);

      const uploadedImages = [];

      for (const image of images) {

        /* EXISTING */
        if (image.existing) {

          uploadedImages.push(
            image.preview
          );

          continue;

        }

        /* NEW */
        const webpBlob =
          await convertToWebP(
            image.file
          );

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

        const storageRef = ref(
          storage,
          `products/${storeId}/${fileName}`
        );

        await uploadBytes(
          storageRef,
          webpBlob,
          {
            contentType:
              "image/webp",
          }
        );

        const url =
          await getDownloadURL(
            storageRef
          );

        uploadedImages.push(url);

      }

      /* UPDATE PRODUCT */
      await updateDoc(
        doc(
          DB,
          "products",
          productId
        ),
        {

          name: name.trim(),

          category:
            category.trim(),

          description:
            description.trim(),

          /* CONSISTENT PRICING */
          price: hasDiscount
            ? Number(
                discountedPrice
              )
            : Number(price),

          oldPrice: hasDiscount
            ? Number(price)
            : null,

          hasDiscount,

          images: uploadedImages,

          thumbnail:
            uploadedImages[0],

          updatedAt:
            serverTimestamp(),

        }
      );

      router.push(
        "/dashboard/products"
      );

    } catch (error) {

      console.log(error);

      showToast(
        "Une erreur est survenue."
      );

    } finally {

      setSaving(false);

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
                  key={`${img.preview}-${index}`}
                  className="image-card"
                >

                  <img
                    src={img.preview}
                    alt=""
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
                          makeThumbnail(
                            index
                          )
                        }
                        className="image-action"
                      >

                        <FiStar />

                      </button>

                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          index
                        )
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
                  onChange={(e) =>
                    handleFiles(
                      e.target.files
                    )
                  }
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
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
            >

              <option value="">
                Sélectionner
              </option>

              <option>
                Mode
              </option>

              <option>
                Beauté
              </option>

              <option>
                Électronique
              </option>

              <option>
                Maison
              </option>

              <option>
                Meubles
              </option>

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