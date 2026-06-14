const CATEGORY_ORDER = [
    "mode",
    "beaute-bien-etre",
    "electronique",
    "maison-cuisine",
    "meubles",
    "telephones-accessoires",
    "sport-fitness",
    "bijoux-montres",
    "sacs-accessoires",
    "jeux-gaming",
    "bebe-enfants",
    "automobile",
    "livres-fournitures",
    "animalerie",
];

export function getNewProductsDiverse(
    products,
    maxProducts = 10
) {

    if (!products?.length) return [];

    const grouped = {};

    products.forEach(product => {

        const category =
            product.category;

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(product);

    });

    const result = [];

    while (
        result.length < maxProducts
    ) {

        let added = false;

        CATEGORY_ORDER.forEach(
            category => {

                if (
                    result.length >=
                    maxProducts
                ) return;

                if (
                    grouped[category] &&
                    grouped[category].length
                ) {

                    result.push(
                        grouped[
                            category
                        ].shift()
                    );

                    added = true;
                }
            }
        );

        if (!added) break;
    }

    return result;
}