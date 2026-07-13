const commandsConfig = {
    categories: {
        admin: {
            title: "Admin Tools",
            emoji: "🛠",
            description: "Moderasi grup dan kontrol anggota",
            order: 1
        },
        downloader: {
            title: "Downloader",
            emoji: "📥",
            description: "Unduh media dari berbagai platform",
            order: 2
        },
        builder: {
            title: "Builder / Maker",
            emoji: "🎨",
            description: "Buat stiker, meme, dan edit gambar",
            order: 3
        },
        utility: {
            title: "Utility",
            emoji: "⚙️",
            description: "Menu, ping, level, runtime, dan alat bantu",
            order: 4
        },
        owner: {
            title: "Owner",
            emoji: "👑",
            description: "Perintah khusus pemilik bot",
            order: 5
        },
        misc: {
            title: "Misc",
            emoji: "📦",
            description: "Command lain yang belum diklasifikasikan",
            order: 99
        }
    },

    hiddenCommands: [
        "eval",
        "shutdown",
        "restart"
    ],

    defaultPrefix: ".",

    menu: {
        showAliases: true,
        showDescription: true,
        showCooldown: true,
        showPermission: true,
        compactMode: false
    }
};

export function getCategoryMeta(category = "misc") {
    const key = String(category || "misc").toLowerCase();
    return commandsConfig.categories[key] || commandsConfig.categories.misc;
}

export function getCategoryList() {
    return Object.entries(commandsConfig.categories)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, value]) => ({
            key,
            ...value
        }));
}

export function isHiddenCommand(commandName = "") {
    const name = String(commandName || "").toLowerCase();
    return commandsConfig.hiddenCommands.includes(name);
}

export default commandsConfig;
