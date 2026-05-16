"use client";

import {useState,useEffect} from "react";
import { useParams } from "next/navigation";
import {PublicStoreProvider,usePublicStore} from "../../../context/PublicStoreContext";
import StoreNav from './StoreNav';
import StoreLoading from "./StoreLoading";

export default function StoreLayout({children}) {
    
    const params = useParams();
    const slug = params.slug;

    return (
        <PublicStoreProvider slug={slug}>
            <StoreNav>
                {children}
            </StoreNav>
        </PublicStoreProvider>
    );
}