"use client";

import { useState,useRef,useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { signInWithGoogle } from "../../lib/auth";
import { DB,storage } from "../../lib/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {ref,uploadBytesResumable,getDownloadURL} from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { FiArrowLeft, FiUpload, FiCheck, FiShoppingBag,FiX,FiAlertCircle } from "react-icons/fi";
import "./onboarding.css";

export default function Onboarding() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { setStore,setLoading  } = useStore();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [hasWhatsapp, setHasWhatsapp] = useState(true);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingImage, setProcessingImage] = useState(false);
    const logoInputRef = useRef(null);

    const [checkingSlug, setCheckingSlug] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        async function checkExistingStore() {
            if (!user) return;

            try {
                const userRef = doc(DB, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && userSnap.data()?.storeId) {
                    router.push("/dashboard");
                }

            } catch (error) {
                console.log(error);
            }
        }

        checkExistingStore();

    }, [user, router]);

    //const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    /* CHECK SLUG */
    useEffect(() => {
        async function checkSlug() {

            if (!slug || slug.length < 3) {
                setSlugAvailable(false);
                return;
            }

            const reservedSlugs = [
                "admin",
                "dashboard",
                "login",
                "api",
                "support",
                "tunishop",
            ];

            if (reservedSlugs.includes(slug)) {
                setSlugAvailable(false);
                return;
            }

            try {
                setCheckingSlug(true);
                const storeRef = doc(DB, "stores", slug);
                const storeSnap = await getDoc(storeRef);
                setSlugAvailable(!storeSnap.exists());
            } catch (error) {
                console.log(error);
            } finally {
                setCheckingSlug(false);
            }
        }

        const timer = setTimeout(() => {
            checkSlug();
        }, 500);

        return () => clearTimeout(timer);

    }, [slug]);

    //Upload image
    const handleImageChange = async (e) => {

  const file =
    e.target.files?.[0];

  if (!file) return;

  try {

    setProcessingImage(true);

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      showToast(
        "Veuillez sélectionner une image"
      );

      return;

    }

    /*
    Allow larger originals
    because compression happens after
    */
    if (
      file.size >
      15 * 1024 * 1024
    ) {

      showToast(
        "Image trop volumineuse"
      );

      return;

    }

    const compressedFile =
      await imageCompression(
        file,
        {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
          initialQuality: 0.8,
        }
      );

    if (
      logoPreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logoPreview
      );

    }

    const previewUrl =
      URL.createObjectURL(
        compressedFile
      );

    setLogoFile(
      compressedFile
    );

    setLogoPreview(
      previewUrl
    );

  } catch (error) {

    console.log(error);

    showToast(
      "Erreur lors du traitement de l'image"
    );

  } finally {

    setProcessingImage(false);

    e.target.value = "";

  }

};

useEffect(() => {

  return () => {

    if (
      logoPreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logoPreview
      );

    }

  };

}, []);

    //Toast message
    const showToast = (message,type = "error") => {
        setToast({message,type,});

        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const tunisianPhoneRegex = /^(2|4|5|9)\d{7}$/;

    //Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast("Store name required");
            return;
        }

        if (name.trim().length < 3) {
            showToast("Store name must be 3 character min");
            return;
        }

        if (!slugAvailable) {
            showToast("Store URL already taken");
            return;
        }

        if (!tunisianPhoneRegex.test(phone)) {
            showToast("Enter a valid Tunisian phone number");
            return;
        }

        try {
            setSubmitting(true);

            /* LOGIN */
            let currentUser = user;

            if (!currentUser) {
                currentUser = await signInWithGoogle();
            }

            /* USER REF */
            const userRef = doc(DB, "users", currentUser.uid);

            const userSnap = await getDoc(userRef);

            /* EXISTING STORE */
            if (userSnap.exists() && userSnap.data()?.storeId) {

                showToast("You already have a store. Redirecting to your dashboard...","info");

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1800);

                return;
            }

            /* UPLOADS */
            let logoUrl = "";

              if (logoFile) {

  const storageRef = ref(
    storage,
    `stores/${slug}/logo.webp`
  );

  const uploadTask =
    uploadBytesResumable(
      storageRef,
      logoFile,
      {
        contentType:
          "image/webp",
      }
    );

  logoUrl =
    await new Promise(
      (
        resolve,
        reject
      ) => {

        const timeout =
          setTimeout(() => {

            reject(
              new Error(
                "Upload timeout"
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

            setUploadProgress(
              Math.round(progress)
            );

          },

          (error) => {

            clearTimeout(timeout);

            reject(error);

          },

          async () => {

            clearTimeout(timeout);

            const url =
              await getDownloadURL(
                uploadTask.snapshot.ref
              );

            resolve(url);

          }

        );

      }
    );

}

            const createdAt = new Date();

            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            const existingStore = await getDoc(
                doc(DB, "stores", slug)
            );

            if (existingStore.exists()) {
                showToast("Nom déjà utilisé");
                setSubmitting(false);
                return;
            }

            /* CREATE STORE */
            await setDoc(doc(DB, "stores", slug), {
                name: name.trim(),
                phone,
                hasWhatsapp,
                slug,
                logo: logoUrl,
                rating: {
                    average: 0,
                    count: 0,
                    total: 0,
                },
                subscription: {
                    plan: "free",
                    status: "active",
                    startedAt: createdAt,
                    expiresAt,
                },
                ownerId: currentUser.uid,
                shipping_fee: Number(8),
                createdAt,
            });

            /* SAVE / UPDATE USER */
            if (userSnap.exists()) {
                await setDoc(userRef,{storeId: slug} , { merge: true });
            } else {
                await setDoc(userRef, {
                    name: currentUser.displayName || "",
                    email: currentUser.email || "",
                    storeId: slug,
                    createdAt: new Date(),
                });
            }

            /* INSTANT STORE HYDRATION */
            setStore({
                id: slug,
                name: name.trim(),
                phone,
                hasWhatsapp,
                slug,
                logo: logoUrl,
                rating: {
                    average: 0,
                    count: 0,
                    total: 0,
                },
                ownerId: currentUser.uid,
                shipping_fee: Number(8),
                subscription: {
                    plan: "free",
                    status: "active",
                    startedAt: createdAt,
                    expiresAt,
                },
                createdAt,
            });

            setLoading(false);

            /* REDIRECT */
            //router.push("/dashboard");
            router.replace("/dashboard");

        } catch (err) {
            console.error(err);
            showToast("Something went wrong");
        } finally {
          setSubmitting(false);
          setUploadProgress(0)
        }
    };

    if (authLoading) {
        return (
            <div className="onboarding-loading">
                Chargement...
            </div>
        );
    }

    return (
        <div className="onboarding">

  {/* TOP */}
  <div className="onboarding-top">

    <Link
      href="/"
      className="back-btn"
    >
      <FiArrowLeft />
      Retour
    </Link>

  </div>

  <div className="onboarding-container">

    {/* FORM */}
    <div className="onboarding-form">

      <h1>
        Créez votre boutique
      </h1>

      <p>
        Lancez votre boutique en ligne
        en moins d’une minute.
      </p>

      {/* BENEFITS */}
      <div className="onboarding-benefits">

        <div>
          <FiCheck />
          Gratuit pendant 30 jours
        </div>

        <div>
          <FiCheck />
          Boutique prête immédiatement
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        {/* STORE NAME */}
        <div className="form-group">

          <label>
            Nom de la boutique
          </label>

          <input
            type="text"
            placeholder="Ex: Amina Fashion"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <div className="slug-box">

            <span className="slug">
              {slug || "ma-boutique"}.tunishop.com
            </span>

            {slug.length >= 3 && (
              <span
                className={`slug-status ${
                  slugAvailable
                    ? "available"
                    : "taken"
                }`}
              >

                {checkingSlug ? (
                  <>
                    <span className="slug-loader"></span>
                    Vérification...
                  </>
                ) : slugAvailable ? (
                  "Disponible"
                ) : (
                  "Déjà utilisé"
                )}

              </span>
            )}

          </div>

        </div>

        {/* LOGO */}
        <div className="upload-grid">

          <div className="upload-box">

            <label>
              Logo
            </label>

            <div
              className="upload-area"
              onClick={() =>
                logoInputRef.current.click()
              }
            >

              {processingImage ? (

  <div className="upload-processing">

    <div className="upload-spinner"></div>

    <span>
      Compression...
    </span>

  </div>

) : logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo"
                />
              ) : (
                <div className="upload-placeholder">

                  <FiUpload />

                  <span>
                    Ajouter un logo
                  </span>

                </div>
              )}

            </div>

            <input
              type="file"
              accept="image/*"
              ref={logoInputRef}
              hidden
              onChange={(e) => handleImageChange(e)}
            />

          </div>

        </div>

        {/* PHONE */}
        <div className="form-group">

          <label>
            Numéro de téléphone
          </label>

          <div className="phone-input-wrapper">

            <div className="phone-prefix">
              +216
            </div>

            <input
              type="tel"
              placeholder="20 123 456"
              value={phone}
              onChange={(e) => {
                const cleaned =
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

                setPhone(
                  cleaned.slice(0, 8)
                );
              }}
            />

          </div>

          <span className="phone-helper">
            Les clients utiliseront ce numéro
            pour vous contacter.
          </span>

        </div>

        {/* WHATSAPP */}
        <label className="whatsapp-checkbox">

          <input
            type="checkbox"
            checked={hasWhatsapp}
            onChange={(e) =>
              setHasWhatsapp(
                e.target.checked
              )
            }
          />

          <span>
            Ce numéro possède WhatsApp
          </span>

        </label>

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

        {/* SUBMIT */}
        <button
          type="submit"
          className="submit-btn"
          disabled={submitting}
        >

          {submitting ? (
  <>
    Création...
    {uploadProgress > 0 &&
      ` ${uploadProgress}%`}
  </>
) : (
            <>
              Créer ma boutique
            </>
          )}

        </button>

      </form>

    </div>

    {/* PREVIEW */}
    <div className="onboarding-preview">

      <p className="preview-title">
        Aperçu en direct
      </p>

      <div className="preview-card">

        <div className="preview-content">

          <div className="preview-logo">

            {logoPreview ? (
              <img
                src={logoPreview}
                alt="logo"
              />
            ) : (
              (name[0] || "T")
                .toUpperCase()
            )}

          </div>

          <h3>
            {name || "Nom boutique"}
          </h3>

          <div className="preview-contact">

            <span>
              +216 {phone || "20 123 456"}
            </span>

            {hasWhatsapp && (
              <div className="preview-whatsapp">
                WhatsApp disponible
              </div>
            )}

          </div>

          <div className="preview-products">

            {[1,2,3,4].map((i) => (
              <div
                key={i}
                className="preview-product"
              >
                <div></div>
                <span>89 TND</span>
              </div>
            ))}

          </div>

        </div>

      </div>

      <div className="preview-footer">

        <FiShoppingBag />

        Mise à jour instantanée

      </div>

    </div>

  </div>

</div>
  );
}
