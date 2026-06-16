"use client";

import { useEffect, useState } from "react";
import {useParams,useRouter} from "next/navigation";
import {collection,doc,getDoc,updateDoc,addDoc,serverTimestamp} from "firebase/firestore";
import { DB } from "../../../../lib/firebaseConfig";
import { uploadToCloudinary } from "../../../../lib/uploadToCloudinary";
import {useStore} from "../../../../context/StoreContext";
import { categories } from "../../../../data/categories";
import Link from "next/link";
import {FiArrowLeft,FiUpload,FiX,FiStar,FiAlertCircle,FiCheckCircle,FiChevronDown,FiImage,FiTag,FiPackage,FiPercent,FiFileText,FiLayers,FiPlus,FiTrash2 } from "react-icons/fi";
import { LuBoxes,LuArchive } from "react-icons/lu";
import "./editProduct.css";

export default function EditProductPage() {

  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  const { store } = useStore();

  const [pageLoading,setPageLoading] = useState(true);
  const [productLoaded,setProductLoaded] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [price, setPrice] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice,setDiscountedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex,setCurrentUploadIndex] = useState(0);
  const [trackInventory, setTrackInventory] = useState(true);
  const [inventory,setInventory] = useState("");
  const [variantsInitialized,setVariantsInitialized] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState({});
  const [variantOptions,setVariantOptions] = useState([]);
  const [variantRows,setVariantRows] = useState([]);
  const [openedGroups,setOpenedGroups] = useState({});
  const [enableLots,setEnableLots] = useState(false);
  const [lotRules,setLotRules] = useState([]);
  const [toast, setToast] = useState(null);

  // FETCH PRODUCT
  useEffect(() => {

  async function fetchProduct() {

    try {

      const productRef = doc(DB,"products",productId);

      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        showToast("Produit introuvable.");
        return;
      }

      const data = productSnap.data();

      // BASIC
      setName(data.name || "");

      setDescription(data.description || "");

      // CATEGORY
      const matchedCategory = categories.find((cat) => cat.slug === data.category_slug);

      setCategory(matchedCategory || null);

      // SUB-CATEGORY
      if (matchedCategory) {

        const matchedSubcategory = matchedCategory.subcategories?.find((sub) =>sub.slug === data.subcategory_slug);

        setSubcategory(
          matchedSubcategory || null
        );

      }

      // PRICE
      setHasDiscount(data.hasDiscount || false);

      if (data.hasDiscount) {

        setPrice(data.oldPrice?.toString() || "");

        setDiscountedPrice(data.price?.toString() || "");

      } else {

        setPrice(data.price?.toString() || "");

        setDiscountedPrice("");

      }

      // INVENTORY
      setTrackInventory(data.trackInventory ?? true);

      setInventory(data.inventory?.toString() || "");

      // IMAGES
      setImages(
        (data.images || []).map(
          (url) => ({
            id: crypto.randomUUID(),
            preview: url,
            existing: true,
          })
        )
      );

      // OPTIONS
      setVariantOptions(

        (data.options || []).map(
          (option) => ({

            id: crypto.randomUUID(),

            name: option.name || "",

            values: option.values || [],

          })
        )

      );

      // VARIANTS
      setVariantRows(

        (data.variants || []).map((variant) => ({

            id: variant.id || crypto.randomUUID(),

            variantKey: variant.variantKey || variant.options?.map((o) => o.value).join("-").toLowerCase(),

            options: variant.options || [],

            inventory: variant.inventory || 0,

            price: variant.price?.toString() || "",

            oldPrice: variant.oldPrice?.toString() || "",

            hasDiscount: variant.hasDiscount || false,

            image: variant.image || "",

            imagePreview: variant.image || "",

            existingImage: true,

            active: variant.active ?? true,

          })
        )

      );

      // LOTS
      setEnableLots(data.lotRules?.enabled || false);

      setLotRules(

        (data.lotRules?.lots || []).map(
          (lot) => ({

            id: crypto.randomUUID(),

            quantity: lot.quantity?.toString() || "",

            price: lot.price?.toString() || "",

          })
        )

      );

      setProductLoaded(true);

    } catch (error) {

      console.log(error);

      showToast("Erreur chargement produit.");

    } finally {

      setPageLoading(false);


    }

  }

  if (productId) {
    fetchProduct();
  }

  }, [productId]);

  const getGroupKey = (index) => `group-${index}`;
  const getVariantKey = (id) => `variant-${id}`;

  //CATEGORIES
  const categoriess = [
    {
      slug: "mode",
      label: "Mode",
    },
    {
      slug: "beaute-bien-etre",
      label: "Beauté & Bien-être",
    },
    {
      slug: "electronique",
      label: "Électronique",
    },
    {
      slug: "maison-cuisine",
      label: "Maison & Cuisine",
    },
    {
      slug: "meubles",
      label: "Meubles",
    },
    {
      slug: "telephones-accessoires",
      label: "Téléphones & Accessoires",
    },
    {
      slug: "sport-fitness",
      label: "Sport & Fitness",
    },
    {
      slug: "bijoux-montres",
      label: "Bijoux & Montres",
    },
    {
      slug: "sacs-accessoires",
      label: "Sacs & Accessoires",
    },
    {
      slug: "jeux-gaming",
      label: "Jeux & Gaming",
    },
    {
      slug: "bebe-enfants",
      label: "Bébé & Enfants",
    },
    {
      slug: "automobile",
      label: "Automobile",
    },
    {
      slug: "livres-fournitures",
      label: "Livres & Fournitures",
    },
    {
      slug: "animalerie",
      label: "Animalerie",
    },
  ].sort((a, b) => a.label.localeCompare(b.label,"fr",{ sensitivity: "base" }));

  //Category selec
  const handleCategorySelect = (selectedCategory) => {

    setCategory(selectedCategory);

    setSubcategory(null);

  };

  //FORMAT PRICE
  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "fr-TN",
      {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }
    ).format(Number(price || 0));
  };

  // BUILD FINAL PRICE
  const buildPriceData = ({hasDiscount,price,discountedPrice}) => {

    // WITH PROMOTION
    if (hasDiscount) {

      return {
        hasDiscount: true,

        // FINAL SELLING PRICE
        price: Number(discountedPrice || 0),

        // ORIGINAL CROSSED PRICE
        oldPrice: Number(price || 0),
      };

    }

    // WITHOUT PROMOTION
    return {

      hasDiscount: false,

      // NORMAL SELLING PRICE
      price: Number(price || 0),

      // NO CROSSED PRICE
      oldPrice: null,
    };

  };

  //TOAST 
  const showToast = (message,type = "error") => {
    setToast({message,type});

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  //Handle files
  const handleFiles = (files) => {

    if (!files || files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(files);

    setImages((prev) => {
      const currentCount = prev.length;

      if (currentCount >= 5) {
        showToast("Maximum 5 images atteint.");
        return prev;
      }

      const remainingSlots = 5 - currentCount;

      const allowedFiles = selectedFiles.slice(0,remainingSlots);

      const validImages = [];

      for (const file of allowedFiles) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const alreadyExists = prev.some((img) => img.file?.name === file?.name && img?.file?.size === file?.size);

        if (alreadyExists) {
          continue
        }

        const preview = URL.createObjectURL(file);

        validImages.push({
          id: crypto.randomUUID(),
          file,
          preview,
        });

      }

      return [
        ...prev,
        ...validImages,
      ];
    });
  };

  //Clean blob
  useEffect(() => {

    return () => {

      images.forEach((img) => {

        if (img.preview?.startsWith("blob:")) {

          URL.revokeObjectURL(img.preview);

        }

      });

    };

  }, [images]);

  // CLEAN VARIANT BLOBS
  useEffect(() => {

    return () => {

      variantRows.forEach((variant) => {

        if (variant.imagePreview?.startsWith("blob:")) {

          URL.revokeObjectURL(
            variant.imagePreview
          );

        }

      });

    };

  }, []);

  //Remove image
  const removeImage = (index) => {

    setImages((prev) => {

      const imageToRemove = prev[index];

      if (imageToRemove?.preview?.startsWith("blob:")) {

        URL.revokeObjectURL(imageToRemove.preview);

      }

      return prev.filter((_, i) => i !== index);

    });
  };

  //THUMBNAIL
  const makeThumbnail = (index) => {

    setImages((prev) => {

      const copy = [...prev];

      const [selected] = copy.splice(index, 1);

      copy.unshift(selected);

      return copy;

    });

  };

  // VARIANT IMAGE
  const handleVariantImage = (variantId,file) => {

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Fichier image invalide.");
      return;
    }

    const preview = URL.createObjectURL(file);

    setVariantRows((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              imageFile: file,
              imagePreview: preview,
            }
          : variant
      )
    );

  };

  const MAX_VARIANT_OPTIONS = 2;

  // ADD VARIANT OPTION
  const addVariantOption = () => {

    if (variantOptions.length >= MAX_VARIANT_OPTIONS) {
      showToast("Maximum 2 variantes.");
      return;
    }

    setVariantOptions((prev) => [

      ...prev,

      {
        id: crypto.randomUUID(),
        name: "",
        values: [],
      }

    ]);

  };

  // REMOVE VARIANT OPTION
  const removeVariantOption = (id) => {

    setVariantOptions((prev) =>
      prev.filter((option) => option.id !== id)
    );

  };

  // UPDATE OPTION NAME
  const updateVariantName = (id,value) => {

    setVariantOptions((prev) => prev.map((option) =>
      option.id === id ? {
        ...option,
        name: value,
      }
      : option
    ));

  };

  //UPDATE OPTION VALUE */
  const updateVariantValue = (optionId,valueIndex,value) => {

    setVariantOptions((prev) => prev.map((option) => {
      if (option.id !== optionId) {
        return option;
      }

      const updatedValues = [
        ...option.values,
      ];

      updatedValues[valueIndex] =
        value;

      return {
        ...option,
        values: updatedValues,
      };

    }));
  };

  //ADD OPTION VALUE
  const addVariantValue = (optionId,value) => {

    if (!value.trim()) return;

    setVariantOptions((prev) => prev.map((option) => {

      if (option.id !== optionId) {
        return option;
      }

      return {
        ...option,
        values: option.values.includes(value.trim()) ? option.values : [
          ...option.values,
          value.trim(),
        ],
      };

    }))
  };

  //REMOVE OPTION VALUE
  const removeVariantValue = (optionId,valueIndex) => {

    setVariantOptions((prev) => prev.map((option) => {
      if (option.id !== optionId) {
        return option;
      }

      return {
        ...option,
        values: option.values.filter((_, index) => index !== valueIndex)
      };

    }));
  };

  const generateVariantCombinations = (options,existingRows = []) => {

    if (!options.length) {
      return [];
    }

    const combinations = [];

    const generate = (index, currentOptions) => {

      if (index === options.length) {

        const currentVariantKey = currentOptions.map((o) => o.value).join("-").toLowerCase();

        const existingVariant = existingRows.find((row) => row.variantKey === currentVariantKey);

        const generalPriceData = buildPriceData({
          hasDiscount,
          price,
          discountedPrice,
        });

        combinations.push({

          id: existingVariant?.id || crypto.randomUUID(),

          variantKey: currentVariantKey,

          options: currentOptions,

          inventory: existingVariant?.inventory ?? 0,

          price: existingVariant?.price?.toString?.() || generalPriceData.price?.toString?.() || "",

          oldPrice: existingVariant?.oldPrice?.toString?.() || generalPriceData.oldPrice?.toString?.() || "",

          hasDiscount: existingVariant ? existingVariant.hasDiscount : hasDiscount,

          image: existingVariant?.image ?? "",

          imageFile: existingVariant?.imageFile ?? null,

          imagePreview: existingVariant?.imagePreview || existingVariant?.image || "",
          
          active: true,

        });

        return;

      }

      const option = options[index];

      option.values.forEach((value) => {

        generate(index + 1, [
          ...currentOptions,
          {
            name: option.name,
            value,
            position: index,
          }
        ]);

      });

    };

    generate(0, []);

    return combinations;

  };

  // ADD LOT
  const addLotRule = () => {

    setLotRules((prev) => [

      ...prev,

      {
        id: crypto.randomUUID(),
        quantity: "",
        price: "",
      }

    ]);

  };

  // REMOVE LOT
  const removeLotRule = (id) => {

    setLotRules((prev) =>
      prev.filter(
        (lot) => lot.id !== id
      )
    );

  };

  // UPDATE LOT
  const updateLotRule = (id,field,value,extra = {}) => {

    setLotRules((prev) =>
      prev.map((lot) =>
        lot.id === id
          ? {
              ...lot,
              [field]: value,
              ...extra,
            }
          : lot
      )
    )
  };

  const updateVariantInventory = (index,value) => {

    setVariantRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              inventory: Number(value)
            }
          : row
      )
    );

  };

  const hasVariants = variantOptions.length > 0;

  useEffect(() => {

  // WAIT PRODUCT FETCH
  if (!productLoaded) return;

  const validOptions = variantOptions
    .map((option) => ({
      ...option,
      values: option.values.filter(
        (value) => value.trim()
      ),
    }))
    .filter(
      (option) =>
        option.name.trim() &&
        option.values.length > 0
    );

  // NO VARIANTS
  if (!validOptions.length) {

    setVariantRows([]);

    return;

  }

  setVariantRows((prevRows) =>
    generateVariantCombinations(
      validOptions,
      prevRows
    )
  );

}, [
  JSON.stringify(variantOptions),
  productLoaded
]);

  //SUBMIT 
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) return;

    if (!name.trim()) {
      showToast("Veuillez saisir le nom du produit.");
      return;
    }

    if (!description.trim()) {
      showToast("Veuillez saisir une description.");
      return;
    }

    if (images.length === 0) {
      showToast("Veuillez ajouter des images.");
      return;
    }

    if (!category) {
      showToast("Veuillez choisir une catégorie.");
      return;

    }

    if (!subcategory) {
      showToast("Veuillez choisir une sous-catégorie.");
      return;
    }


    if (!price || Number(price) <= 0) {
      showToast("Le prix doit être supérieur à 0.");
      return;
    }


    if (hasDiscount) {
      if (!discountedPrice ||Number(discountedPrice) <= 0) {
        showToast("Veuillez saisir le prix promotionnel.");
        return;
      }

      if (Number(discountedPrice) >= Number(price)) {
        showToast("Le prix promotionnel doit être inférieur au prix original.");
        return;
      }
    }

    if (trackInventory && !hasVariants) {

      if (!inventory ||Number(inventory) <= 0) {

        showToast("Le stock doit être supérieur à 0.");

        return;
      }
    }

    // VALIDATE VARIANTS
    if (hasVariants) {

      for (const variant of variantRows) {

        const finalVariantPrice = variant.price;

        if (!variant.image && !variant.imageFile) {
          showToast("Chaque variante doit avoir une image.");
          return;
        }

        if (!finalVariantPrice || Number(finalVariantPrice) <= 0) {
          showToast("Chaque variante doit avoir un prix valide.");
          return;
        }

        if (variant.hasDiscount && (!variant.oldPrice ||Number(variant.oldPrice) <= 0)) {
          showToast("Veuillez saisir le prix original des variantes.");
          return;
        }

        if (variant.hasDiscount && Number(variant.oldPrice) <= Number(variant.price)) {
          showToast("Le prix promotionnel doit être inférieur au prix original.");
          return;
        }
      }
    }

    // VALIDATE LOTS
    if (enableLots) {
      for (const lot of lotRules) {

        if (!lot.quantity ||Number(lot.quantity) <= 0) {
          showToast("Chaque lot doit avoir une quantité valide.");
          return;
        }

        if (!lot.price || Number(lot.price) <= 0) {
          showToast("Chaque lot doit avoir un prix valide.");
          return;
        }
      }
    }

    try {

      setLoading(true);

      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {

        const image = images[i];

        // EXISTING IMAGE
        if (image.existing) {

          uploadedImages.push(image.preview);

          continue;

        }

        setCurrentUploadIndex(i + 1);

        const url = await uploadToCloudinary(image.file,(percent) => {
          const totalProgress = ((i +percent / 100) /images.length) * 100;

          setUploadProgress(Math.round(totalProgress));

        });

        const webpUrl = url.replace("/upload/","/upload/f_webp,q_auto,w_1200/");

        uploadedImages.push(webpUrl);

      }

      // UPLOAD VARIANT IMAGES
      const uploadedVariants = await Promise.all(variantRows.map(async (variant) => {

        let uploadedImage = variant.image || "";

        // NEW IMAGE
        if (variant.imageFile) {

          const url = await uploadToCloudinary(variant.imageFile);

          uploadedImage = url.replace("/upload/","/upload/f_webp,q_auto,w_800/");

        }

        return {
          ...variant,
          image: uploadedImage,
        };

      }));

      await updateDoc(doc(DB,"products",productId),{
        name: name.trim(),
        category: category.label,
        category_slug: category.slug,
        subcategory: subcategory.label,
        subcategory_slug: subcategory.slug,
        description: description.trim(),
        price: hasDiscount ? Number(discountedPrice) : Number(price),
        hasDiscount,
        oldPrice: hasDiscount ? Number(price) : null,
        images: uploadedImages,
        thumbnail: uploadedImages[0],
        shipping_fee: Number(store?.shipping_fee || 8),
        active: true,
        updatedAt: serverTimestamp(),
        trackInventory,
        inventory: hasVariants ? variantRows.reduce((sum,variant) => sum + Number(variant.inventory || 0), 0) : Number(inventory || 0),
        hasVariants,
        options: hasVariants ? variantOptions
          .filter((option) => option.name.trim())
          .map((option) => ({
            name: option.name.trim(),
            values: option.values.filter((value) => value.trim()),
          })) : [],

        variants: hasVariants ? uploadedVariants.map((variant) => ({
          id: variant.id,

          variantKey: variant.options
            .map((o) => o.value)
            .join("-")
            .toLowerCase(),

          options: variant.options,

          inventory: Number(variant.inventory || 0),

          price: Number(variant.price || 0),

          hasDiscount: variant.hasDiscount,

          oldPrice: variant.hasDiscount ? Number(variant.oldPrice || 0) : null,

          image: variant.image || "",

          active: true,
        })) : [],

        lotRules: enableLots ? {
          enabled: true,
          lots: lotRules.map((lot) => ({
            quantity: Number(lot.quantity || 0),
            price: Number(lot.price || 0),
          })),
        } : {
          enabled: false,
          lots: [],
        },
      });

      router.push("/dashboard/products");

    } catch (error) {
      console.log("UPLOAD ERROR:",error);
      showToast("Une erreur est survenue.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  //Grouped Variants
  const groupedVariants = Object.values(variantRows.reduce((acc, variant) => {

    const firstOption = variant.options[0];

    const parentKey = firstOption?.value || "Default";

    if (!acc[parentKey]) {

      acc[parentKey] = {
        parentLabel: `${firstOption?.name}: ${firstOption?.value}`,
        variants: [],
      };

    }

    acc[parentKey].variants.push(
      variant
    );

    return acc;

  }, {}));

  const hasNestedVariants = variantOptions.length > 1;

  //Page loading ...
  if (pageLoading) {

    return (
      <div className="edit-loading">
        Chargement...
      </div>
    );

  }

  return (
    <div className="new-product-page">

      <Link
        href="/dashboard/products"
        className="back-products"
      >
        <FiArrowLeft />
        Retour aux produits
      </Link>

      <div className="new-product-header">

        <h1>Modifier le produit</h1>

        <p>Modifiez les informations du produit</p>

      </div>

      <form
        onSubmit={handleSubmit}
        className="product-layout"
      >

        {/* LEFT CONTENT */}
        <div className="product-main-column">

          {/* NAME + DESCRIPTION Section */}
          <div className="product-card">
            <div className="product-card-header">

              <div className="product-card-title-wrap">
                <div className="product-card-icon">
                  <FiPackage />
                </div>

                <div>
                  <h3>Détails du produit</h3>
                  <p>Informations principales visibles par les clients.</p>
                </div>
              </div>

            </div>

            <div className="product-card-content">

              <div className="form-group">
                <label>Nom du produit</label>

                <input
                  type="text"
                  placeholder="Ex : T-shirt en coton"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value.trimStart())}
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows={6}
                  maxLength={3000}
                  placeholder="Décrivez votre produit..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.trimStart())}
                />

                <small>
                  Ajoutez les détails importants concernant votre produit.
                </small>
              </div>

            </div>

          </div>

          {/* IMAGES */}
          <div className="product-card">

            <div className="product-card-header">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiImage />
                </div>

                <div>
                  <h3>Images</h3>
                  <p>La première image sera utilisée comme miniature.</p>
                </div>

              </div>

            </div>

            <div className="product-card-content">

              <div className="images-grid modern-images-grid">

                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="image-preview"
                  >

                    <img
                      src={image.preview}
                      alt="Preview"
                      loading="lazy"
                      className="preview-image"
                    />

                    {index === 0 && (
                      <span className="thumbnail-badge">
                        Miniature
                      </span>
                    )}

                    <div className="image-overlay">

                      {index !== 0 ? (
                        <button
                          type="button"
                          onClick={() => makeThumbnail(index)}
                        >
                          <FiStar />
                        </button>
                      ) : (
                        <span></span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-btn"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="upload-box">
                    <FiUpload />

                    <span>Ajouter</span>

                    <small>Max 5 images</small>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        handleFiles(e.target.files); 
                        e.target.value = ""
                      }}
                    />
                  </label>
                )}

              </div>

            </div>

          </div>

          {/* CATEGORY */}
          <div className="product-card">

            <div className="product-card-header">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiFileText />
                </div>

                <div>

                  <h3>Catégorie</h3>

                  <p>
                    Sélectionnez la catégorie principale du produit.
                  </p>

                </div>

              </div>

            </div>

            <div className="product-card-content">

              <div className="categories-grid">

                {categories.map((cat) => (

                  <button
                    key={cat.slug}
                    type="button"
                    className={`category-card ${category?.slug === cat.slug ? "active" : ""}`}
                    onClick={() =>
                      handleCategorySelect(cat)
                    }
                  >

                    <img
                      src={cat.image}
                      alt={cat.label}
                    />

                    <span>
                      {cat.label}
                    </span>

                  </button>

                ))}

              </div>

            </div>

          </div>
          
          {/* SUB-CATEGORY */}
          {category && (

            <div className="product-card">

              <div className="product-card-header">

                <div className="product-card-title-wrap">

                  <div className="product-card-icon">
                    <FiLayers />
                  </div>

                  <div>

                    <h3>Sous-catégorie</h3>

                    <p>
                      Choisissez le type précis du produit.
                    </p>

                  </div>

                </div>

              </div>

              <div className="product-card-content">

                <div className="subcategories-grid">

                  {category.subcategories.map((sub) => (

                    <button
                      key={sub.slug}
                      type="button"
                      className={`subcategory-card ${subcategory?.slug === sub.slug ? "active" : ""}`}
                      onClick={() =>
                        setSubcategory(sub)
                      }
                    >

                      {sub.label}

                    </button>

                  ))}

                </div>

              </div>

            </div>

          )}

          {/* PRIX */}
          <div className="product-card">
            <div className="product-card-header">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiTag />
                </div>

                <div>
                  <h3>Prix</h3>
                  <p>Définissez le prix principal du produit.</p>
                </div>

              </div>

            </div>

            <div className="product-card-content">
                <div className="double-grid">

                  <div className="form-group">

                    <label>Prix (DT)</label>

                    <input
                      type="number"
                      min="0"
                      placeholder="0.000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />

                  </div>

                 

                </div>

                {/* PROMOTION */}
                <div className="premium-box">

                  <div className="premium-box-top">

                    <div className="premium-box-left">

                      <div className="premium-mini-icon">
                        <FiPercent />
                      </div>

                      <div>
                        <h4>Promotion</h4>
                        <p>Afficher un prix barré avec un prix réduit.</p>
                      </div>

                    </div>

                    <label className="switch">

                      <input
                        type="checkbox"
                        checked={hasDiscount}
                        onChange={() => setHasDiscount(!hasDiscount)}
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                  {hasDiscount && (
                    <div className="discount-grid">

                      <div className="form-group">

                        <label>Prix original</label>

                        <input
                          type="number"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />

                      </div>

                      <div className="form-group" style={{marginTop:'10px'}}>

                        <label>Prix promotionnel</label>

                        <input
                          type="number"
                          min="0"
                          value={discountedPrice}
                          onChange={(e) => setDiscountedPrice(e.target.value)}
                        />

                      </div>

                    </div>
                  )}

                </div>

            </div>

          </div>
          
          {/* INVENTAIRE */}
          <div className="product-card">

            <div className="product-card-header product-card-header-column-mobile">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <LuBoxes />
                </div>

                <div>
                  <h3>Inventaire</h3>
                  <p>Suivez le stock disponible pour éviter les ruptures.</p>
                </div>

              </div>

              <div className="inventory-switch-wrap">

                <span>Suivi du stock</span>

                <label className="switch">

                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={() => setTrackInventory(!trackInventory)}
                  />

                  <span className="slider"></span>

                </label>

              </div>

            </div>

            <div className="product-card-content">

              <div className="inventory-grid">

                <div className="form-group">

                  <label>Quantité disponible</label>

                  <input
                    type="number"
                    min="0"
                    disabled={!trackInventory}
                    placeholder="Ex : 120"
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                  />

                  <small>

                    {hasVariants
                      ? "Chaque variante possède son propre stock ci-dessous."
                      : "Nombre total de pièces disponibles à la vente."}

                  </small>

                </div>

              </div>

            </div>

          </div>

          {/* VARIANTS */}
          <div className="product-card">

            <div className="product-card-header product-card-header-column-mobile" >

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiLayers />
                </div>

                <div>
                  <h3>Variantes</h3>
                  <p>
                    Ajoutez des tailles, couleurs ou autres options.
                  </p>
                </div>

              </div>
              
              {variantOptions.length < MAX_VARIANT_OPTIONS && (

             
              <button
                type="button"
                className="modern-add-btn"
                onClick={addVariantOption}
                disabled={variantOptions.length >= MAX_VARIANT_OPTIONS}
              >

                <FiPlus />

                Ajouter

              </button>
               )}
              

            </div>

            <div className="product-card-content">

              {variantOptions.length === 0 ? (

                <div className="empty-variants-box">

                  <FiLayers />

                  <h4>Aucune variante</h4>

                  <p>
                    Ajoutez des options comme taille ou couleur
                    pour gérer les prix, images et stocks.
                  </p>

                  <button
                    type="button"
                    className="modern-outline-btn"
                    onClick={addVariantOption}
                  >

                    <FiPlus />

                    Ajouter une variante

                  </button>

                </div>

              ) : (

                <div className="variants-list">

                  {variantOptions.map((option) => (

                    <div key={option.id} className="modern-variant-card">

                      {/* HEADER */}
                      <div className="modern-variant-header">

                        <div className="form-group modern-variant-name">

                          <label>Nom de la variante</label>

                          <input
                            style={{backgroundColor:'#fff'}}
                            type="text"
                            placeholder="Ex : Taille, Couleur..."
                            value={option.name}
                            onChange={(e) =>
                              updateVariantName(
                                option.id,
                                e.target.value
                              )
                            }
                          />

                        </div>

                        <button
                          type="button"
                          className="modern-remove-btn"
                          onClick={() =>
                            removeVariantOption(option.id)
                          }
                        >

                          <FiTrash2 />

                        </button>

                      </div>

                      {/* VALUES */}
                      <div className="modern-variant-values">

                        <label>Options</label>

                      </div>

                      {/* INPUT OPTIONS */}
                      <div className="modern-option-input-wrap">

                        <input
                          type="text"
                          placeholder="Ajouter une option + Entrée"
                          value={variantDrafts[option.id] || ""}
                          onChange={(e) =>
                            setVariantDrafts((prev) => ({
                              ...prev,
                              [option.id]: e.target.value,
                            }))
                          }

                          onKeyDown={(e) => {

                            if (e.key === "Enter" || e.key === ",") {

                              e.preventDefault();

                              const value = (variantDrafts[option.id] || "").trim();

                              if (!value) return;

                              addVariantValue(option.id,value);

                              setVariantDrafts((prev) => ({
                                ...prev,
                                [option.id]: "",
                              }));

                            }

                          }}
                        />

                        <button
                          type="button"
                          className="modern-option-add-btn"
                          onClick={() => {

                            const value = (variantDrafts[option.id] || "").trim();

                            if (!value) return;

                            addVariantValue(option.id,value);

                            setVariantDrafts((prev) => ({
                              ...prev,
                              [option.id]: "",
                            }));

                          }}
                        >

                          <FiPlus />

                        </button>

                      </div>

                      <div className="modern-tags-wrap">

                        {option.values.map((value, index) => (

                          <div
                            key={index}
                            className="modern-tag"
                          >

                            <span>{value}</span>

                            <button
                              type="button"
                              onClick={() =>
                                removeVariantValue(
                                  option.id,
                                  index
                                )
                              }
                            >

                              <FiX />

                            </button>

                          </div>

                        ))}

                      </div>

                    </div>

                  ))}

                </div>

              )}

              {/* COMBINAISONS */}
              {variantRows.length > 0 && (

                <>

                  <div className="variants-divider"></div>

                  <div className="modern-combinations-top">

                    <div>

                      <h3>Combinaisons</h3>

                      <p>Gérez les prix, promotions et stocks de chaque variante.</p>

                    </div>

                    <div className="modern-combinations-count">

                      {variantRows.length}

                    </div>

                  </div>


                  <div className="modern-combinations-box">

                    {hasNestedVariants ? (

                      groupedVariants.map((group, index) => {

                        const isOpen = openedGroups[getGroupKey(index)] || false;

                        return (

                          <div
                            key={index}
                            className="modern-group"
                          >

                            {/* PARENT */}
                            <button
                              type="button"
                              className="modern-group-parent"
                              onClick={() =>
                                setOpenedGroups((prev) => ({
                                  ...prev,
                                  [getGroupKey(index)]: !prev[getGroupKey(index)]
                                }))
                              }
                            >

                              <div className="modern-group-left">

                                <div className="modern-group-badge">

                                  {group.parentLabel}

                                </div>

                                <span>{group.variants.length} variantes</span>

                              </div>

                              <FiChevronDown className={ isOpen ? "rotate" : "" }/>

                            </button>

                            {/* CHILDREN */}
                            {isOpen && (

                              <div className="modern-group-content">

                                {group.variants.map((variant) => {

                                  const values = variant.options.map((o) => o.value);

                                  return (

                                    <div key={variant.id} className="modern-combo-item">

                                      {/* COLLAPSIBLE HEADER */}
                                      <button
                                        type="button"
                                        className="modern-combo-trigger"
                                        onClick={() =>
                                          setOpenedGroups((prev) => ({
                                            ...prev,
                                            [getVariantKey(variant.id)]: !prev[getVariantKey(variant.id)]
                                          }))
                                        }
                                      >

                                        <div className="modern-combo-trigger-left">

                                          <div className="modern-combo-avatar">

                                            {variant.imagePreview ? (

                                              <img
                                                src={variant.imagePreview}
                                                alt="variant image"
                                              />

                                            ) : (

                                              <FiPackage />

                                            )}

                                          </div>

                                          <div>

                                            <h4>{hasNestedVariants ? values[1] : values[0]}</h4>

                                            <p>

                                              {formatPrice(
                                                variant.price
                                              )} DT

                                              {" "}·{" "}

                                              {variant.inventory || 0} {" "} en stock

                                            </p>

                                          </div>

                                        </div>

                                        <FiChevronDown className={openedGroups[getVariantKey(variant.id)] ? "rotate" : ""}/>

                                      </button>


                                      {/* CONTENT */}
                                      {openedGroups[getVariantKey(variant.id)] && (

                                        <div className="modern-combo-content">

                                          {/* IMAGE */}
                                          <div className="modern-combo-image-section">

                                            <label className="modern-combo-upload">

                                              {variant.imagePreview ? (

                                                <img
                                                  src={variant.imagePreview}
                                                  alt="variant image"
                                                />

                                              ) : (

                                                <FiUpload />

                                              )}

                                              <input
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                onChange={(e) => {

                                                  const file =e.target.files?.[0];

                                                  handleVariantImage(variant.id,file);

                                                  e.target.value = "";

                                                }}
                                              />

                                            </label>

                                          </div>


                                          {/* FIELDS */}
                                          <div className="modern-combo-fields">

                                            {/* PRICE */}
                                            <div className="modern-combo-field">

                                              <label>
                                                Prix
                                              </label>

                                              <input
                                                type="number"
                                                min="0"
                                                placeholder="0.000"
                                                value={variant.price ?? ""}
                                                onChange={(e) => {
                                                  const value = e.target.value;

                                                  setVariantRows((prev) =>
                                                    prev.map((row) =>
                                                      row.id === variant.id
                                                        ? {
                                                            ...row,
                                                            price: value,
                                                          }
                                                        : row
                                                    )
                                                  );

                                                }}
                                              />

                                            </div>


                                            {/* STOCK */}
                                            <div className="modern-combo-field">

                                              <label>
                                                Stock
                                              </label>

                                              <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={variant.inventory ?? ""}
                                                onChange={(e) => {

                                                  const value = e.target.value;

                                                  setVariantRows((prev) =>
                                                    prev.map((row) =>
                                                      row.id === variant.id
                                                        ? {
                                                            ...row,
                                                            inventory: Number(value)
                                                          }
                                                        : row
                                                    )
                                                  );

                                                }}
                                              />

                                            </div>

                                            {/* DISCOUNT */}
                                            <div className="modern-combo-discount">

                                              <div className="modern-combo-discount-left">

                                                <div className="premium-mini-icon">
                                                  <FiPercent />
                                                </div>

                                                <div>

                                                  <h5>
                                                    Promotion
                                                  </h5>

                                                  <p>
                                                    Activer un prix promo
                                                  </p>

                                                </div>

                                              </div>

                                              <label className="switch">

                                                <input
                                                  type="checkbox"
                                                  checked={variant.hasDiscount}
                                                  onChange={(e) => {

                                                    const checked = e.target.checked;

                                                    setVariantRows((prev) =>
                                                      prev.map((row) =>
                                                        row.id === variant.id
                                                          ? {
                                                              ...row,
                                                              hasDiscount:
                                                                checked,
                                                            }
                                                          : row
                                                      )
                                                    );

                                                  }}
                                                />

                                                <span className="slider"></span>

                                              </label>

                                            </div>


                                            {/* DISCOUNT FIELDS */}
                                            {variant.hasDiscount && (

                                              <div className="modern-combo-discount-grid">

                                                {/* ORIGINAL */}
                                                <div className="modern-combo-field">

                                                  <label>
                                                    Prix original
                                                  </label>

                                                  <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0.000"
                                                    value={variant.oldPrice ?? ""}
                                                    onChange={(e) => {
                                                      const value = e.target.value;

                                                      setVariantRows((prev) =>
                                                        prev.map((row) =>
                                                          row.id === variant.id
                                                            ? {
                                                                ...row,
                                                                oldPrice: value,
                                                              }
                                                            : row
                                                        )
                                                      );

                                                    }}
                                                  />

                                                </div>


                                                {/* DISCOUNTED */}
                                                <div className="modern-combo-field">

                                                  <label>
                                                    Prix promotionnel
                                                  </label>

                                                  <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0.000"
                                                    value={variant.price ?? ""}
                                                    onChange={(e) => {
                                                      const value = e.target.value;

                                                      setVariantRows((prev) =>
                                                        prev.map((row) =>
                                                          row.id === variant.id
                                                            ? {
                                                                ...row,
                                                                price: value,
                                                              }
                                                            : row
                                                        )
                                                      );

                                                    }}
                                                  />

                                                </div>

                                              </div>

                                            )}

                                          </div>

                                        </div>

                                      )}

                                    </div>

                                  );

                                }
                                )}

                              </div>

                            )}

                          </div>

                        );

                      })

                    ) : (

                      variantRows.map((variant) => {

                        const values = variant.options?.map((option) => option.value) || [];

                        return (

                          <div
                            key={variant.id}
                            className="modern-combo-item"
                          >

                            {/* COLLAPSIBLE HEADER */}
                            <button
                              type="button"
                              className="modern-combo-trigger"
                              onClick={() =>
                                setOpenedGroups((prev) => ({
                                  ...prev,
                                  [getVariantKey(variant.id)]: !prev[getVariantKey(variant.id)]
                                }))
                              }
                            >

                              <div className="modern-combo-trigger-left">

                                <div className="modern-combo-avatar">

                                  {variant.imagePreview ? (

                                    <img
                                      src={variant.imagePreview}
                                      alt=""
                                    />

                                  ) : (

                                    <FiPackage />

                                  )}

                                </div>

                                <div>

                                  <h4>{hasNestedVariants? values[1]: values[0]}</h4>

                                  <p>
                                    {formatPrice(
                                      variant.price
                                    )} DT

                                    {" "}·{" "}

                                    {variant.inventory || 0}
                                    {" "}en stock

                                  </p>

                                </div>

                              </div>

                              <FiChevronDown
                                className={
                                  openedGroups[
                                    getVariantKey(variant.id)
                                  ]
                                    ? "rotate"
                                    : ""
                                }
                              />

                            </button>


                            {/* CONTENT */}
                            {openedGroups[getVariantKey(variant.id)] !== false && (

                              <div className="modern-combo-content">

                                {/* IMAGE */}
                                <div className="modern-combo-image-section">

                                  <label className="modern-combo-upload">

                                    {variant.imagePreview ? (

                                      <img
                                        src={variant.imagePreview}
                                        alt="image preview"
                                      />

                                    ) : (

                                      <FiUpload />

                                    )}

                                    <input
                                      type="file"
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {

                                        const file = e.target.files?.[0];

                                        handleVariantImage(variant.id,file);

                                        e.target.value = "";

                                      }}
                                    />

                                  </label>

                                </div>


                                {/* FIELDS */}
                                <div className="modern-combo-fields">

                                  {/* PRICE */}
                                  <div className="modern-combo-field">

                                    <label>Prix</label>

                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0.000"
                                      value={variant.price ?? ""}
                                      onChange={(e) => {

                                        const value = e.target.value;

                                        setVariantRows((prev) =>
                                          prev.map((row) =>
                                            row.id === variant.id
                                              ? {
                                                  ...row,
                                                  price: value,
                                                }
                                              : row
                                          )
                                        );

                                      }}
                                    />

                                  </div>

                                  {/* STOCK */}
                                  <div className="modern-combo-field">

                                    <label>Stock</label>

                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={variant.inventory ?? ""}
                                      onChange={(e) => {

                                        const value = e.target.value;

                                        setVariantRows((prev) =>
                                          prev.map((row) =>
                                            row.id === variant.id
                                              ? {
                                                  ...row,
                                                  inventory: Number(value)
                                                }
                                              : row
                                          )
                                        );

                                      }}
                                    />

                                  </div>


                                  {/* DISCOUNT */}
                                  <div className="modern-combo-discount">

                                    <div className="modern-combo-discount-left">

                                      <div className="premium-mini-icon">
                                        <FiPercent />
                                      </div>

                                      <div>

                                        <h5>
                                          Promotion
                                        </h5>

                                        <p>
                                          Activer un prix promo
                                        </p>

                                      </div>

                                    </div>

                                    <label className="switch">

                                      <input
                                        type="checkbox"
                                        checked={variant.hasDiscount}
                                        onChange={(e) => {

                                          const checked = e.target.checked;

                                          setVariantRows((prev) =>
                                            prev.map((row) =>
                                              row.id === variant.id
                                                ? {
                                                    ...row,
                                                    hasDiscount:
                                                      checked,
                                                  }
                                                : row
                                            )
                                          );

                                        }}
                                      />

                                      <span className="slider"></span>

                                    </label>

                                  </div>


                                  {/* DISCOUNT FIELDS */}
                                  {variant.hasDiscount && (

                                    <div className="modern-combo-discount-grid">

                                      {/* ORIGINAL */}
                                      <div className="modern-combo-field">

                                        <label>
                                          Prix original
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          placeholder="0.000"
                                          value={variant.oldPrice ?? ""}
                                          onChange={(e) => {

                                            const value = e.target.value;

                                            setVariantRows((prev) =>
                                              prev.map((row) =>
                                                row.id === variant.id
                                                  ? {
                                                      ...row,
                                                      oldPrice: value,
                                                    }
                                                  : row
                                              )
                                            );

                                          }}
                                        />

                                      </div>


                                      {/* DISCOUNTED */}
                                      <div className="modern-combo-field">

                                        <label>
                                          Prix promotionnel
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          placeholder="0.000"
                                          value={variant.price ?? ""}
                                          onChange={(e) => {
                                            const value = e.target.value;

                                            setVariantRows((prev) =>
                                              prev.map((row) =>
                                                row.id === variant.id
                                                  ? {
                                                      ...row,
                                                      price: value,
                                                    }
                                                  : row
                                              )
                                            );

                                          }}
                                        />

                                      </div>

                                    </div>

                                  )}

                                </div>

                              </div>

                            )}

                          </div>

                        );

                      })

                    )}

                  </div>

                </>

              )}

            </div>

          </div>

          {/* VENTE EN LOT */}
          <div className="product-card">

            <div className="product-card-header product-card-header-column-mobile">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <LuArchive />
                </div>

                <div>
                  <h3>Vente en lot</h3>
                  <p>
                    Proposez des tarifs dégressifs
                    pour les achats en grande quantité.
                  </p>
                </div>

              </div>

              <div className="inventory-switch-wrap">

                <span>Activer</span>

                <label className="switch">

                  <input
                    type="checkbox"
                    checked={enableLots}
                    onChange={() =>
                      setEnableLots(!enableLots)
                    }
                  />

                  <span className="slider"></span>

                </label>

              </div>

            </div>

            <div className="product-card-content">

              {!enableLots ? (

                <div className="empty-lots-box">

                  <LuArchive />

                  <h4>Vente en lot désactivée</h4>

                  <p>
                    Activez cette option pour permettre
                    aux clients d’acheter plusieurs pièces
                    avec des prix spéciaux.
                  </p>

                </div>

              ) : (

                <div className="modern-lots-wrapper">

                  {lotRules.length === 0 && (

                    <div className="modern-lots-empty">

                      <p>
                        Aucun lot ajouté pour le moment.
                      </p>

                    </div>

                  )}


                  <div className="modern-lots-grid">

                    {lotRules.map((lot, index) => (

                      <div
                        key={lot.id}
                        className="modern-lot-card"
                      >

                        {/* TOP */}
                        <div className="modern-lot-top">

                          <div>

                            <h4>
                              Lot {index + 1}
                            </h4>

                            <p>
                              Configurez ce pack produit.
                            </p>

                          </div>

                          <button
                            type="button"
                            className="modern-remove-btn"
                            onClick={() =>
                              removeLotRule(lot.id)
                            }
                          >

                            <FiTrash2 />

                          </button>

                        </div>


                        {/* GRID */}
                        <div className="modern-lot-inputs">

                          {/* QUANTITY */}
                          <div className="form-group">

                            <label>
                              Pièces / lot
                            </label>

                            <input
                              type="number"
                              min="1"
                              placeholder="Ex : 10"
                              value={lot.quantity}
                              onChange={(e) =>
                                updateLotRule(
                                  lot.id,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />

                          </div>

                          {/* PRICE */}
                          <div className="form-group">

                            <label>
                              Prix du lot (DT)
                            </label>

                            <input
                              type="number"
                              min="0"
                              placeholder="0.000"
                              value={lot.price}
                              onChange={(e) =>
                                updateLotRule(
                                  lot.id,
                                  "price",
                                  e.target.value
                                )
                              }
                            />

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>


                  {/* ADD */}
                  <button
                    type="button"
                    className="modern-add-lot-btn"
                    onClick={addLotRule}
                  >

                    <FiPlus />

                    Ajouter un lot

                  </button>

                </div>

              )}

            </div>

          </div>
          
          {/* RESUMEE */}
          <div className="product-card">

            <div className="product-card-header">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiFileText />
                </div>

                <div>

                  <h3>Résumé</h3>

                  <p>
                    Vérifiez les informations avant la mise à jour.
                  </p>

                </div>

              </div>

            </div>

            <div className="product-card-content">

              <div className="summary-box">

                <ul>

                  <li>
                    <span>Images</span>
                    <strong>{images.length}</strong>
                  </li>

                  <li>
                    <span>Variantes</span>
                    <strong>{variantRows.length}</strong>
                  </li>

                  <li>
                    <span>Lots</span>
                    <strong>{lotRules.length}</strong>
                  </li>

                  <li>
                    <span>Catégorie</span>
                    <strong>
                      {category?.label || "-"}
                    </strong>
                  </li>

                  <li>
                    <span>Sous-catégorie</span>
                    <strong>
                      {subcategory?.label || "-"}
                    </strong>
                  </li>

                </ul>

              </div>

              {toast && (
                <div className={`checkout-toast ${toast.type}`} style={{minWidth:'250px'}}>
                  <div className="toast-left">
                    <div className={`toast-icon ${toast.type}`}>
                      {toast.type === "success" ? (
                        <FiCheckCircle />
                      ) : (
                        <FiAlertCircle />
                      )}
                    </div>
                      
                    <p>{toast.message}</p>
                  </div>
                      
                  <button
                    className="toast-close"
                    onClick={() => setToast(null)}
                  >
                    <FiX />
                  </button>
                </div>
              )}

              <div className="sidebar-actions">

                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Enregistrement...
                    </>
                  ) : (
                    "Mettre à jour le produit"
                  )}

                </button>

                <button
                  type="button"
                  className="cancel-btn"
                >
                  Annuler
                </button>

              </div>

            </div>

          </div>

        </div>

      </form>

    </div>
  );
}


/*

        <aside className="product-sidebar">

          <div className="product-card sidebar-card sticky-sidebar">

            <div className="product-card-header">

              <div className="product-card-title-wrap">

                <div className="product-card-icon">
                  <FiFileText />
                </div>

                <div>
                  <h3>Organisation</h3>
                  <p>Résumé du produit</p>
                </div>

              </div>

            </div>

            <div className="product-card-content sidebar-content">

              <div className="form-group">

                <label>Catégorie</label>

                <select
                  value={category?.slug || ""}
                  onChange={(e) => {
                    const selectedCategory = categories.find(
                      (cat) => cat.slug === e.target.value
                    );

                    setCategory(selectedCategory);
                  }}
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}

                </select>

              </div>

              <div className="summary-box">

                <h4>Résumé</h4>

                <ul>

                  <li>
                    <span>Images</span>
                    <strong>{images.length}</strong>
                  </li>

                  <li>
                    <span>Variantes</span>
                    <strong>{variantRows.length}</strong>
                  </li>

                  <li>
                    <span>Lots</span>
                    <strong>{lotRules.length}</strong>
                  </li>

                </ul>

              </div>

              {toast && (
                <div className={`checkout-toast ${toast.type}`} style={{minWidth:'250px'}}>
                  <div className="toast-left">
                    <div className={`toast-icon ${toast.type}`}>
                      {toast.type === "success" ? (
                        <FiCheckCircle />
                      ) : (
                        <FiAlertCircle />
                      )}
                    </div>
                      
                    <p>{toast.message}</p>
                  </div>
                      
                  <button
                    className="toast-close"
                    onClick={() => setToast(null)}
                  >
                    <FiX />
                  </button>
                </div>
              )}

              <div className="sidebar-actions">

                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Enregistrement...
                    </>
                  ) : (
                    "Mettre à jour le produit"
                  )}

                </button>

                <button
                  type="button"
                  className="cancel-btn"
                >
                  Annuler
                </button>

              </div>

            </div>

          </div>

        </aside>
*/
