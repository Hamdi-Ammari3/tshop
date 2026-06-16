import {collection,getDocs} from "firebase/firestore";
import { DB } from "./firebaseConfig";

export async function searchProducts(keyword) {

    const searchTerm = keyword.trim().toLowerCase();

    if (!searchTerm) {
        return [];
    }

    const snapshot = await getDocs(
        collection(DB,"products")
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })).filter(product => product.name?.toLowerCase().includes(searchTerm));
}