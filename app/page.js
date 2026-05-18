"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { LuSparkles,LuRocket } from "react-icons/lu";
import { HiOutlineGlobe } from "react-icons/hi";
import { FaStar } from "react-icons/fa";

export default function Home() {

  return (
    <main>

  {/* HERO */}
  <section className="hero">
    <div className="hero-container">

      {/* LEFT */}
      <div className="hero-left">

        <div>
          <span className="hero-badge">
            <LuSparkles color="#ff7a18" />
            Disponible en Tunisie
          </span>
        </div>

        <h1 className="hero-title">
          Créez votre{" "}
          <span className="gradient-text">
            boutique en ligne
          </span>{" "}
          en 1 minute
        </h1>

        <p className="hero-desc">
          Vendez facilement sur Instagram,
          Facebook et WhatsApp avec votre
          propre boutique professionnelle.
        </p>

        <div className="hero-actions">
          <Link
            href="/onboarding"
            className="btn-primary"
          >
            Créer ma boutique
            <FiArrowRight />
          </Link>
        </div>

        <div className="hero-trust">
          <div className="avatars">
            {["A", "S", "M", "K"].map((l, i) => (
              <div
                key={i}
                className="avatar"
                style={{
                  opacity: 1 - i * 0.2,
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <span>
            Déjà adopté par{" "}
            <strong>
              2 400+
            </strong>{" "}
            vendeurs
          </span>
        </div>

      </div>

      {/* RIGHT */}
      <div className="hero-right">

        <div className="hero-glow"></div>

        <div className="hero-image-box">
          <img
            src="/hero.png"
            alt="Boutique en ligne"
            className="hero-image"
          />
        </div>

      </div>

    </div>
  </section>

  {/* HOW */}
  <section
    id="how"
    className="how"
  >
    <div className="how-container">

      <div className="how-header">
        <p className="how-subtitle">
          Comment ça marche
        </p>

        <h2 className="how-title">
          3 étapes simples
        </h2>
      </div>

      <div className="how-grid">

        {[
          {
            n: "1",
            t: "Créez votre boutique",
            d: "Ajoutez votre nom, logo et informations.",
          },
          {
            n: "2",
            t: "Ajoutez vos produits",
            d: "Photos, prix et description en quelques secondes.",
          },
          {
            n: "3",
            t: "Partagez votre lien",
            d: "Envoyez votre boutique sur WhatsApp, Facebook et Instagram.",
          },
        ].map((step) => (
          <div
            key={step.n}
            className="how-card"
          >

            <div className="how-number">
              {step.n}
            </div>

            <h3>
              {step.t}
            </h3>

            <p>
              {step.d}
            </p>

          </div>
        ))}

      </div>
    </div>
  </section>

  {/* BENEFITS */}
  <section
    id="benefits"
    className="benefits"
  >
    <div className="benefits-container">

      <div className="benefits-grid">

        {[
          {
            icon: <LuRocket />,
            t: "Lancez votre activité rapidement",
            d: "Pas besoin de développeur ou de compétences techniques.",
          },
          {
            icon: <HiOutlineGlobe />,
            t: "Soyez visible partout",
            d: "Partagez votre boutique facilement avec vos clients.",
          },
          {
            icon: <LuSparkles />,
            t: "Gardez le contrôle",
            d: "Vous gérez vos commandes, livraisons et clients.",
          },
        ].map((b, i) => (
          <div
            key={i}
            className="benefit-card"
          >

            <div className="benefit-icon">
              {b.icon}
            </div>

            <h3>
              {b.t}
            </h3>

            <p>
              {b.d}
            </p>

          </div>
        ))}

      </div>

    </div>
  </section>

  {/* TESTIMONIALS */}
  <section className="testimonials">

    <div className="testimonials-container">

      <div className="testimonials-header">
        <h2>
          Les vendeurs adorent T-Shop
        </h2>
      </div>

      <div className="testimonials-grid">

        {[
          {
            name: "Amina",
            review:
              "J’ai créé ma boutique en quelques minutes seulement.",
            store:
              "Boutique mode à Tunis",
          },
          {
            name: "Sami",
            review:
              "Maintenant j’envoie simplement le lien de ma boutique à mes clients.",
            store:
              "Accessoires à Sousse",
          },
          {
            name: "Donia",
            review:
              "Mes produits sont plus organisés et professionnels.",
            store:
              "Pâtisserie artisanale",
          },
        ].map((t, i) => (
          <div
            key={i}
            className="testimonial-card"
          >

            <div className="testimonial-stars">
              {[...Array(5)].map((_, index) => (
                <FaStar key={index} />
              ))}
            </div>

            <p className="testimonial-text">
              "{t.review}"
            </p>

            <p className="testimonial-name">
              {t.name}
            </p>

            <p className="testimonial-store">
              {t.store}
            </p>

          </div>
        ))}

      </div>

    </div>
  </section>

  {/* CTA */}
  <section className="cta">

    <div className="cta-container">

      <div className="cta-box">

        <div className="cta-glow"></div>

        <div className="cta-content">

          <h2>
            Votre boutique est prête
            en quelques minutes.
          </h2>

          <p>
            Commencez gratuitement.
            Aucune carte bancaire requise.
          </p>

          <Link
            href="/onboarding"
            className="cta-btn"
          >
            Créer ma boutique
            <FiArrowRight />
          </Link>

        </div>

      </div>

    </div>

  </section>

</main>
  );
}