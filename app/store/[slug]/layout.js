"use client";

import { useParams } from "next/navigation";
import {PublicStoreProvider} from "../../../context/PublicStoreContext";
import StoreNav from './StoreNav';

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