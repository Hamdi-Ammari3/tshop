"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signInWithGoogle } from "../../lib/auth";
import { DB } from "../../lib/firebaseConfig";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { useAuth } from "../../context/AuthContext";

import {
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";

import "./login.css";

export default function LoginPage() {

  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* AUTO REDIRECT */
  useEffect(() => {

    async function checkUser() {

      if (authLoading || !user) return;

      try {

        const userRef = doc(
          DB,
          "users",
          user.uid
        );

        const userSnap = await getDoc(userRef);

        if (
          userSnap.exists() &&
          userSnap.data()?.storeId
        ) {

          router.replace("/dashboard");

        } else {

          router.replace("/onboarding");
        }

      } catch (error) {

        console.log(error);
      }
    }

    checkUser();

  }, [user, authLoading, router]);

  /* LOGIN */
  async function handleLogin() {

    if (loading) return;

    try {

      setLoading(true);

      setError("");

      /* GOOGLE LOGIN */
      const currentUser =
        await signInWithGoogle();

      /* USER REF */
      const userRef = doc(
        DB,
        "users",
        currentUser.uid
      );

      const userSnap =
        await getDoc(userRef);

      /* CREATE USER */
      if (!userSnap.exists()) {

        await setDoc(userRef, {
          name:
            currentUser.displayName || "",

          email:
            currentUser.email || "",

          storeId: null,

          createdAt: new Date(),
        });
      }

      /* REDIRECT */
      if (
        userSnap.exists() &&
        userSnap.data()?.storeId
      ) {

        router.replace("/dashboard");

      } else {

        router.replace("/onboarding");
      }

    } catch (error) {

      console.log(error);

      if (
        error.code ===
        "auth/popup-closed-by-user"
      ) {

        setError(
          "Connexion annulée"
        );

      } else {

        setError(
          "Une erreur est survenue. Veuillez réessayer."
        );
      }

    } finally {

      setLoading(false);
    }
  }

  /* LOADING AUTH */
  if (authLoading) {

    return (
      <div className="login-loading-page">

        <FiLoader className="spin-icon" />

        <p>
          Chargement...
        </p>

      </div>
    );
  }

  return (
    <div className="login-page">

      {/* TOP */}
      <div className="login-top">

        <Link
          href="/"
          className="login-back-btn"
        >

          <FiArrowLeft />

          Retour

        </Link>

      </div>

      {/* CONTENT */}
      <div className="login-container">

        <div className="login-card">

          {/* TOP */}
          <div className="login-card-top">

            <div className="login-badge">
              Accès sécurisé
            </div>

            <h2>
              Connexion
            </h2>

            <p>
              Accédez à votre boutique
              rapidement avec Google.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            className="google-login-btn"
            onClick={handleLogin}
            disabled={loading}
          >

            {loading ? (
              <>

                <FiLoader className="spin-icon" />

                Connexion...

              </>
            ) : (
              <>

                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                />

                Continuer avec Google

              </>
            )}

          </button>

          {/* FOOTER */}
          <p className="login-footer-text">

            En continuant, vous acceptez
            nos conditions d’utilisation
            et notre politique de confidentialité.

          </p>

        </div>

      </div>

    </div>
  );
}