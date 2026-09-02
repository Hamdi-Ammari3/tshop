"use client";

import { useState,useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {getCategoryProducts} from "../../../lib/products";
import ProductSection from '../../components/ProductSection';
import {categories} from '../../../data/categories';
import {FiLoader,FiArrowLeft} from "react-icons/fi";
import { MdArrowBack } from "react-icons/md";
import './category.css'

export default function CategoryPage() {

    const { slug } = useParams();

    const category = categories.find(c => c.slug === slug);

    const [products,setProducts] = useState([]);
    const [lastDoc,setLastDoc] = useState(null);
    const [hasMore,setHasMore] = useState(true);
    const [loading,setLoading] = useState(true);

    //initial fetch
    useEffect(() => {

        async function load() {

            try {

                const result = await getCategoryProducts(slug,30);

                setProducts(result.products);

                setLastDoc(result.lastDoc);

                setHasMore(result.hasMore);

            } catch(error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        }

        if(slug) {
            load();
        }

    }, [slug]);

    //Fetch more
    async function handleLoadMore() {

        if (!lastDoc) {
            setHasMore(false);
            return;
        }

        const nextPage = await getCategoryProducts(slug,30,lastDoc);

        setProducts(prev => [
            ...prev,
            ...nextPage.products,
        ]);

        setLastDoc(nextPage.lastDoc);

        setHasMore(nextPage.hasMore);
    }


    if (loading) {

        return (
            <div className="loading-page">
                <FiLoader className="spin-icon"/>
            </div>
        );

    }

    return (
        <main className="marketplace">
            
            {products.length === 0 ? (

                <div className="empty-category">

                    <img
                        src={category?.image}
                        alt={category?.label}
                        className="empty-category-image"
                    />

                    <h2>
                        Aucun produit disponible
                    </h2>

                    <p>
                        Aucun produit n'a encore été publié dans la catégorie{" "}
                        <strong>
                            {category?.label}
                        </strong>.
                        Revenez bientôt pour découvrir les nouveautés.
                    </p>

                    <Link
                        href="/"
                        className="empty-category-btn"
                    >
                        Découvrir d'autres catégories
                    </Link>

                </div>

            ) : (

                <ProductSection
                    title={`${category?.label}`}
                    showTitle={true}
                    products={products}
                    showMore={hasMore}
                    onShowMore={handleLoadMore}
                />

            )}

        </main>
    );

}