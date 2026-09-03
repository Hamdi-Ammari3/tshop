"use client";

import {useEffect,useState,useRef} from "react";
import Link from "next/link";
import {FiChevronLeft,FiChevronRight} from "react-icons/fi";
import {slides} from "../../data/slides";
import "./HeroSlider.css";

export default function HeroSlider() {

    const [index,setIndex] = useState(0);
    const touchStartX = useRef(null);
    const touchDeltaX = useRef(0);

    useEffect(() => {

        const timer = setInterval(() => {

            setIndex((prev) => (prev + 1) % slides.length);

        },6000);

        return () => clearInterval(timer);

    },[]);

    function goToSlide(newIndex){

        if(newIndex < 0){

            setIndex(slides.length - 1);

            return;

        }

        if(newIndex >= slides.length){

            setIndex(0);

            return;

        }

        setIndex(newIndex);

    }

    // SWIPE HANDLERS
    function handleTouchStart(e){
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    }

    function handleTouchMove(e){
        if (touchStartX.current === null) return;
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    }

    function handleTouchEnd(){
        if (touchStartX.current === null) return;

        const SWIPE_THRESHOLD = 50;

        if (touchDeltaX.current > SWIPE_THRESHOLD) {
            // swiped right → previous slide
            goToSlide(index - 1);
        } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
            // swiped left → next slide
            goToSlide(index + 1);
        }

        touchStartX.current = null;
        touchDeltaX.current = 0;
    }

    return (

        <section className="hero-slider">

            <div className="hero-slider-wrapper">

                <div
                    className="hero-slider-track"
                    style={{
                        transform:`translateX(-${index * 100}%)`
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >

                    {slides.map((slide,i) => (

                        <div
                            key={i}
                            className={`hero-slide ${slide.align}`}
                        >

                            <img
                                src={slide.image}
                                alt={slide.title}
                                loading={i === 0 ? "eager" : "lazy"}
                                className="hero-slide-image"
                            />

                            <div className="hero-overlay"></div>

                            <div className="hero-content">

                                <div className="hero-text">

                                    <span className="hero-badge">

                                        {slide.badge}

                                    </span>

                                    <h2>

                                        {slide.title}

                                    </h2>

                                    <p>

                                        {slide.description}

                                    </p>

                                    {/* 
                                    <Link
                                        href={slide.link}
                                        className="hero-button"
                                    >

                                        {slide.button}

                                    </Link>
                                    */}

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

                {/* PREVIOUS */}

                <button
                    className="hero-arrow hero-left"
                    onClick={() => goToSlide(index - 1)}
                >

                    <FiChevronLeft/>

                </button>

                {/* NEXT */}

                <button
                    className="hero-arrow hero-right"
                    onClick={() => goToSlide(index + 1)}
                >

                    <FiChevronRight/>

                </button>

                {/* DOTS */}

                <div className="hero-dots">

                    {slides.map((_,i) => (

                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={
                                i === index
                                ? "hero-dot active"
                                : "hero-dot"
                            }
                        />

                    ))}

                </div>

            </div>

        </section>

    );

}