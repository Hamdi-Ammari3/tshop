"use client";

import { useEffect, useState } from "react";
import {FiUpload,FiSave,FiPhone,FiTruck,FiCheckCircle,FiX,FiAlertCircle} from "react-icons/fi";
import imageCompression from "browser-image-compression";
import { doc, updateDoc } from "firebase/firestore";
import {ref,uploadBytesResumable,getDownloadURL} from "firebase/storage";
import {DB,storage} from "../../../lib/firebaseConfig";
import { useStore } from "../../../context/StoreContext";
import { ClipLoader } from "react-spinners";
import "./settings.css";

export default function SettingsPage() {

  const { store } = useStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [shippingFee, setShippingFee] = useState(8);
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);

  /* LOAD STORE DATA */
  useEffect(() => {

    if (!store) return;

    setName(store.name || "");
    setPhone(store.phone || "");

    setHasWhatsapp(
      store.hasWhatsapp || false
    );

    setShippingFee(
      store.shipping_fee || 8
    );

    setLogo(store.logo || "");

  }, [store]);

  useEffect(() => {

  return () => {

    if (
      logo?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logo
      );

    }

  };

}, []);

  /* TOAST */
  const showToast = (message,type = "error") => {
    setToast({message,type});

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /* HANDLE LOGO */
  const handleLogoChange = async (e) => {

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

      showToast("Veuillez sélectionner une image valide.");

      return;

    }

    /*
    Allow larger originals
    because compression happens later
    */
    if (
      file.size >
      15 * 1024 * 1024
    ) {

      showToast("Image trop volumineuse.");

      return;

    }

    const compressedFile =
      await imageCompression(
        file,
        {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1200,
          useWebWorker: typeof window !== "undefined" && window.innerWidth > 768,
          fileType: "image/webp",
          initialQuality: 0.75,
          preserveExif: false,
          alwaysKeepResolution: false,
        }
      );

    /*
    CLEAN OLD BLOB
    */
    if (
      logo?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logo
      );

    }

    const previewUrl =
      URL.createObjectURL(
        compressedFile
      );

    setLogo(previewUrl);

    setLogoFile(
      compressedFile
    );

  } catch (error) {

    console.log(error);

    showToast("Erreur lors du traitement de l'image.");

  } finally {

    setProcessingImage(false);

    e.target.value = "";

  }

};

  const tunisianPhoneRegex = /^(2|4|5|9)\d{7}$/;

  /* SAVE SETTINGS */
  async function handleSubmit(e) {

    e.preventDefault();

    if (!name.trim()) {
      showToast("Veuillez saisir le nom de la boutique.");

      return;
    }

    if (!phone.trim()) {
      showToast("Veuillez saisir un numéro de téléphone.");
      return;
    }

    if (!tunisianPhoneRegex.test(phone)) {
      showToast("Veuillez saisir un numéro tunisien valide.");
      return;
    }

    try {

      setLoading(true);

      let logoUrl = logo;

      /* UPLOAD LOGO */
      if (logoFile) {
        const logoRef = ref(
  storage,
  `stores/${store.id}/logo.webp`
);

const uploadTask =
  uploadBytesResumable(
    logoRef,
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

      /* UPDATE STORE */
      await updateDoc(
        doc(
          DB,
          "stores",
          store.id
        ),
        {
          name: name.trim(),
          phone,
          hasWhatsapp,
          shipping_fee:
            Number(
              shippingFee
            ) || 0,
          logo: logoUrl,
        }
      );

      showToast(
  "Paramètres mis à jour avec succès.",
  "success"
);

    } catch (error) {

      console.log(error);

      showToast("Une erreur est survenue. Veuillez réessayer.");

    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-header">

        <h1 className="settings-title">
          Paramètres
        </h1>

        <p className="settings-desc">
          Gérez les informations de
          votre boutique
        </p>

      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="settings-form"
      >

        {/* LOGO */}
        <div className="form-group">

          <label>
            Logo de la boutique
          </label>

          <div className="logo-section">

            <div className="logo-preview">

              {processingImage ? (

  <div className="logo-processing">

    <div className="logo-spinner"></div>

    <span>
      Compression...
    </span>

  </div>

) : logo ? (

  <img
    src={logo}
    alt="Logo boutique"
  />

) : (

  name?.[0] || "B"

)}

            </div>

            <label className="logo-upload-btn">

              <FiUpload />

              Télécharger un logo

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleLogoChange
                }
              />

            </label>

          </div>

        </div>

        {/* STORE NAME */}
        <div className="form-group">

          <label>
            Nom de la boutique
          </label>

          <input
            type="text"
            placeholder="Ex: Mode Élégance"
            value={name}
            maxLength={40}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

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
              placeholder="21 234 567"
              value={phone}
              onChange={(e) => {

                const cleaned =
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

                setPhone(
                  cleaned.slice(
                    0,
                    8
                  )
                );
              }}
            />

          </div>

        </div>

        {/* WHATSAPP */}
        <label className="settings-checkbox">

          <input
            type="checkbox"
            checked={hasWhatsapp}
            onChange={(e) =>
              setHasWhatsapp(
                e.target.checked
              )
            }
          />

          <div className="checkbox-content">

            <span>
              WhatsApp disponible
            </span>

            <small>
              Les clients pourront
              vous contacter
              directement via
              WhatsApp.
            </small>

          </div>

        </label>

        {/* SHIPPING */}
        <div className="form-group">

          <label>
            <FiTruck />
            Frais de livraison
            (TND)
          </label>

          <input
            type="number"
            min="0"
            placeholder="Prix de livraison"
            value={shippingFee}
            onChange={(e) =>
              setShippingFee(
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
        
                      <div
  className={`toast-icon ${toast.type}`}
>

  {toast.type === "success" ? (
    <FiCheckCircle />
  ) : (
    <FiAlertCircle />
  )}

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

        {/* ACTION */}
        <div className="settings-actions">

          <button
            type="submit"
            className="save-settings-btn"
            disabled={loading}
          >

            {loading ? (
              <>
                <ClipLoader
                  size={16}
                  color="#fff"
                />
                <>
                  Enregistrement...
                  {uploadProgress > 0 && ` ${uploadProgress}%`}
                </>
              </>
            ) : (
              <>
                <FiSave />
                Enregistrer les
                modifications
              </>
            )}

          </button>

        </div>

      </form>
    </div>
  );
}