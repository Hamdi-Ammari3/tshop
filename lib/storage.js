import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

export async function uploadImage(file, path) {
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  return url;
}