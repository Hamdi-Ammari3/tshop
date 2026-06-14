import {collection,getDocs,getDoc,doc,query,where,orderBy,limit,startAfter} from "firebase/firestore";
import { DB } from "./firebaseConfig";

//Fetch new products
export async function getNewProducts() {

  const q = query(
    collection(DB, "products"),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

//Fetch all products
export async function getProductsPage(pageSize = 30,lastDoc = null) {

  let q;

  if (lastDoc) {

    q = query(
      collection(DB, "products"),
      //orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize + 1)
    );

  } else {

    q = query(
      collection(DB, "products"),
      //orderBy("createdAt", "desc"),
      limit(pageSize + 1)
    );

  }

  const snapshot = await getDocs(q);

  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;

  const visibleDocs = hasMore? docs.slice(0, pageSize): docs;

  return {

    products: visibleDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })),

    lastDoc: visibleDocs[visibleDocs.length - 1],

    hasMore,
  };
}

//Fetch selected category products
export async function getCategoryProducts(slug,pageSize = 30,lastDoc = null) {

  let q;

  if (lastDoc) {

    q = query(
      collection(DB,"products"),
      where("category_slug","==",slug),
      startAfter(lastDoc),
      limit(pageSize + 1)
    );

  } else {

    q = query(
      collection(DB,"products"),
      where("category_slug","==",slug),
      limit(pageSize + 1)
    );

  }

  const snapshot = await getDocs(q);

  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;

  const visibleDocs = hasMore? docs.slice(0,pageSize): docs;

  return {
    products: visibleDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })),
    lastDoc: visibleDocs[visibleDocs.length - 1],
    hasMore,
  };

}

//Fetch product details
export async function getProduct(productId) {

  const ref = doc(DB,"products",productId);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return {
    id:snap.id,
    ...snap.data(),
  };

}