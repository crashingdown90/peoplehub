// Bank list for Indonesia
// Used in registration form dropdown

export interface Bank {
    code: string;
    name: string;
    swiftCode?: string;
}

export const BANK_LIST: Bank[] = [
    // Bank BUMN
    { code: "MANDIRI", name: "Bank Mandiri", swiftCode: "BMRIIDJA" },
    { code: "BNI", name: "Bank BNI", swiftCode: "ABORIDJA" },
    { code: "BRI", name: "Bank BRI", swiftCode: "BRINIDJA" },
    { code: "BTN", name: "Bank BTN", swiftCode: "BTANIDJA" },

    // Bank Swasta Besar
    { code: "BCA", name: "Bank BCA", swiftCode: "CENAIDJA" },
    { code: "CIMB", name: "Bank CIMB Niaga", swiftCode: "BABORIDJA" },
    { code: "DANAMON", name: "Bank Danamon", swiftCode: "BABORIDJA" },
    { code: "PANIN", name: "Bank Panin", swiftCode: "PINBIDJA" },
    { code: "OCBC", name: "Bank OCBC NISP", swiftCode: "NABORIDJA" },
    { code: "MAYBANK", name: "Bank Maybank Indonesia", swiftCode: "MABORIDJA" },
    { code: "PERMATA", name: "Bank Permata", swiftCode: "BABORIDJA" },
    { code: "MEGA", name: "Bank Mega", swiftCode: "MEGAIDJA" },
    { code: "SINARMAS", name: "Bank Sinarmas", swiftCode: "SABORIDJA" },
    { code: "BTPN", name: "Bank BTPN", swiftCode: "SUABORIDJA" },

    // Bank Syariah
    { code: "BSI", name: "Bank Syariah Indonesia", swiftCode: "BABORIDJA" },
    { code: "MUAMALAT", name: "Bank Muamalat", swiftCode: "MUABORIDJA" },

    // Bank Digital
    { code: "JAGO", name: "Bank Jago", swiftCode: "JAGORIDJA" },
    { code: "BLU", name: "Blu by BCA Digital" },
    { code: "SEABANK", name: "SeaBank" },
    { code: "NEO", name: "Bank Neo Commerce" },
    { code: "ALLO", name: "Allo Bank" },

    // Bank Asing
    { code: "HSBC", name: "HSBC Indonesia", swiftCode: "HSBCIDJA" },
    { code: "CITI", name: "Citibank", swiftCode: "CABORIDJA" },
    { code: "SC", name: "Standard Chartered", swiftCode: "SCABORIDJA" },

    // Lainnya
    { code: "OTHER", name: "Lainnya" },
];

// Helper to get bank by code
export function getBankByCode(code: string): Bank | undefined {
    return BANK_LIST.find((bank) => bank.code === code);
}

// Helper to get bank name by code
export function getBankName(code: string): string {
    const bank = getBankByCode(code);
    return bank?.name || code;
}

// Bank options for dropdown/select
export const BANK_OPTIONS = BANK_LIST.map((bank) => ({
    value: bank.code,
    label: bank.name,
}));
