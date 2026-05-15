"use client";

import { useEffect, useState } from "react";
import {
  FiUpload,
  FiSave,
  FiPhone,
  FiTruck,
  FiCheckCircle,
} from "react-icons/fi";

import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  DB,
  storage,
} from "../../../lib/firebaseConfig";

import { useStore } from "../../../context/StoreContext";

import { ClipLoader } from "react-spinners";

import "./settings.css";

export default function SettingsPage() {

  const { store } = useStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] =
    useState(false);

  const [shippingFee, setShippingFee] =
    useState(8);

  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

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

  /* CONVERT IMAGE TO WEBP */
  async function convertToWebP(file) {

    return new Promise((resolve, reject) => {

      try {

        const img = new Image();

        img.src =
          URL.createObjectURL(file);

        img.onload = () => {

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = img.width;
          canvas.height = img.height;

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
                reject(
                  new Error(
                    "Erreur de conversion image"
                  )
                );

                return;
              }

              const webpFile =
                new File(
                  [blob],
                  `${Date.now()}.webp`,
                  {
                    type:
                      "image/webp",
                  }
                );

              resolve(webpFile);
            },
            "image/webp",
            0.8
          );
        };

        img.onerror = () => {
          reject(
            new Error(
              "Image invalide"
            )
          );
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /* HANDLE LOGO */
  const handleLogoChange = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    /* VALIDATE IMAGE */
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Veuillez sélectionner une image valide."
      );

      return;
    }

    /* LIMIT SIZE */
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "La taille de l'image doit être inférieure à 5MB."
      );

      return;
    }

    setLogo(
      URL.createObjectURL(file)
    );

    setLogoFile(file);
  };

  /* SAVE SETTINGS */
  async function handleSubmit(e) {

    e.preventDefault();

    if (!name.trim()) {
      alert(
        "Veuillez saisir le nom de la boutique."
      );

      return;
    }

    if (
      phone &&
      phone.length !== 8
    ) {
      alert(
        "Le numéro doit contenir 8 chiffres."
      );

      return;
    }

    try {

      setLoading(true);

      let logoUrl = logo;

      /* UPLOAD LOGO */
      if (logoFile) {

        const webpLogo =
          await convertToWebP(
            logoFile
          );

        const logoRef = ref(
          storage,
          `stores/${store.id}/logo.webp`
        );

        await uploadBytes(
          logoRef,
          webpLogo
        );

        logoUrl =
          await getDownloadURL(
            logoRef
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

      alert(
        "Les paramètres ont été mis à jour avec succès."
      );

    } catch (error) {

      console.log(error);

      alert(
        "Une erreur est survenue. Veuillez réessayer."
      );

    } finally {
      setLoading(false);
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

              {logo ? (
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
              placeholder="XXXXXXXX"
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
                Enregistrement...
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