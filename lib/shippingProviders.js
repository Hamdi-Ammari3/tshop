/* ─── PROVIDER CATALOGUE ─────────────────────────────── */
/* fee / delay are placeholders — replace with your real per-carrier rates */

export const PROVIDERS = [
    {
        id:          "colissimo",
        name:        "Colissimo",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Colissimo Username", placeholder: "Colissimo Username", secret: false },
            { key: "apiKey",   label: "Colissimo Key",      placeholder: "Colissimo Key", secret: false },
        ],
        docsUrl: "https://delivery.colissimo.com.tn/",
        logo:    "/colissimologo.png",
        color:   "#003b7e",
    },

    {
        id:          "colisexpress",
        name:        "Colis Express",
        authType:    "credentials",
        fields: [
            { key: "username", label: "ID", placeholder: "ID", secret: false },
            { key: "apiKey",   label: "API Key",      placeholder: "API Key", secret: false },
        ],
        docsUrl: "https://client.coliexpres.com/",
        logo:    "/colisExpress.jpg",
        color:   "#003b7e",
    },

    {
        id:          "abmdelivery",
        name:        "Abm Delivery",
        authType:    "credentials",
        fields: [
            { key: "apiKey",label: "Abm Delivery Key",placeholder: "Abm Delivery Key", secret: false },
        ],
        docsUrl: "https://client.abm-delivery.com/",
        logo:    "/abmDelivery.jpg",
        color:   "#003b7e",
    },

    {
        id:          "adex",
        name:        "Adex",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Adex Username", placeholder: "Adex Username", secret: false },
            { key: "apiKey",   label: "Adex Password", placeholder: "Adex Password", secret: false },
        ],
        docsUrl: "https://adex.tn/",
        logo:    "/adex.png",
        color:   "#003b7e",
    },

    {
        id:          "afex",
        name:        "Afex",
        authType:    "credentials",
        fields: [
            { key: "apiKey",label: "API KEY",placeholder: "API KEY", secret: false },
        ],
        docsUrl: "https://delivery.afex.tn/",
        logo:    "/afex.png",
        color:   "#003b7e",
    },

    {
        id:          "aflex",
        name:        "Aflex",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Token", placeholder: "Token", secret: false },
            { key: "apiKey",   label: "Tracking Token", placeholder: "Tracking Token", secret: false },
        ],
        docsUrl: "https://aflex-delivery.com/",
        logo:    "/aflex.png",
        color:   "#003b7e",
    },

    {
        id:          "aramex",
        name:        "Aramex",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Username", placeholder: "Username", secret: false },
            { key: "apiKey",   label: "Password", placeholder: "Password", secret: false },
            { key: "pin",   label: "Account Pin", placeholder: "Account Pin", secret: false },
            { key: "number",   label: "Account Number", placeholder: "Account Number", secret: false },
        ],
        docsUrl: "https://www.aramex.com/tn/fr",
        logo:    "/aramex.webp",
        color:   "#003b7e",
    },

    {
        id:          "a2bdelivery",
        name:        "A2B Delivery",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Token", placeholder: "Token", secret: false },
            { key: "apiKey",   label: "Tracking Token", placeholder: "Tracking Token", secret: false },
        ],
        docsUrl: "https://a2b.tn/",
        logo:    "/a2b-delivery.png",
        color:   "#003b7e",
    },

    {
        id:          "axessdelivery",
        name:        "Axess Delivery",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Token", placeholder: "Token", secret: false },
            { key: "apiKey",   label: "Id Entrepot", placeholder: "Id Entrepot", secret: false },
        ],
        docsUrl: "https://www.axesslogistique.com/",
        logo:    "/axessDelevery.png",
        color:   "#003b7e",
    },

    {
        id:          "bestdelivery",
        name:        "Best Delivery",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Best Delivery Username", placeholder: "Best Delivery Username", secret: false },
            { key: "apiKey",   label: "Best Delivery Password", placeholder: "Best Delivery Password", secret: false },
        ],
        docsUrl: "https://best-delivery.net/",
        logo:    "/bestDelevery.png",
        color:   "#003b7e",
    },

    {
        id:          "bestwaydelivery",
        name:        "Bestway Delivery",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Bestway Username", placeholder: "Bestway Username", secret: false },
            { key: "apiKey",   label: "Bestway Password", placeholder: "Bestway Password", secret: false },
        ],
        docsUrl: "https://vi.bestway-delivery.tn/",
        logo:    "/bestWayDelevery.png",
        color:   "#003b7e",
    },

    {
        id:          "bonjourexpress",
        name:        "Bonjour Express",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Token", placeholder: "Token", secret: false },
            { key: "apiKey",   label: "User ID", placeholder: "User ID", secret: false },
        ],
        docsUrl: "https://bonjourexpress.com/",
        logo:    "/bonjourExpress.png",
        color:   "#003b7e",
    },

    {
        id:          "calirexdelivery",
        name:        "Calirex Delivery",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Username", placeholder: "Username", secret: false },
            { key: "apiKey",   label: "Password", placeholder: "Password", secret: false },
        ],
        docsUrl: "https://calirextn.com/",
        logo:    "/carilexDelivery.jpg",
        color:   "#003b7e",
    },

    {
        id:          "ciblexexpress",
        name:        "Ciblex Express",
        authType:    "credentials",
        fields: [
            { key: "apiKey",   label: "Token", placeholder: "Token", secret: false },
        ],
        docsUrl: "https://ciblexexpress.tn/",
        logo:    "/ciblexExpress.jpg",
        color:   "#003b7e",
    },

    {
        id:          "colispro",
        name:        "Colis Pro",
        authType:    "credentials",
        fields: [
            { key: "username", label: "Phone", placeholder: "Phone", secret: false },
            { key: "apiKey",   label: "Password", placeholder: "Password", secret: false },
        ],
        docsUrl: "https://colis-pro-guezmil.com/",
        logo:    "/colisPro.png",
        color:   "#003b7e",
    },

    {
        id:          "megaboss",
        name:        "Megaboss",
        authType:    "credentials",
        fields: [
            { key: "apiKey",   label: "Token", placeholder: "Token", secret: false },
        ],
        docsUrl: "https://megaboss.store/",
        logo:    "/megaboss.png",
        color:   "#003b7e",
    },
];

/* Small helper — used in a few places across the shipping dashboard and
   will also be handy later for the /api/shipping routes and adapters. */
export function getProviderById(id) {
    return PROVIDERS.find((p) => p.id === id);
}