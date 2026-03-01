const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const readline = require("readline");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ================= CONFIG =================

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1477162403652173825";

const MIN_DELAY = 3 * 60 * 1000; // 3 min
const MAX_DELAY = 30 * 60 * 1000; // 30 min

const THUMBNAIL_URL =
    "https://media.discordapp.net/attachments/1475156049999954104/1477178285543919636/jEvev6Q.png";

const EMBED_COLOR = 0xF6A6C1;

// ==========================================

// ---------- Utility ----------

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay(min = MIN_DELAY, max = MAX_DELAY) {
    return random(min, max);
}

function randomRobuxAmount() {
    return random(10, 130) * 1000;
}

function randomStars() {
    const roll = Math.random();
    if (roll < 0.5) return 5;   // 50% chance of 5 stars
    if (roll < 0.8) return 4;   // 30% chance of 4 stars
    if (roll < 0.95) return 3;  // 15% chance of 3 stars
    return 2;                   // 5% chance of 2 stars (rare)
}

// ---------- Customer Logic ----------

function maskedDiscordId() {
    let digits = "";
    for (let i = 0; i < 6; i++) digits += random(0, 9);
    return `ID: ${digits}******`;
}

function randomCustomer() {
    const roll = Math.random();
    if (roll < 0.45) return "Returning Customer";
    if (roll < 0.75) return maskedDiscordId();
    if (roll < 0.9) return "Guest Checkout";
    return "Anonymous";
}

// ---------- Payment ----------

const PAYMENT_METHODS = [
    { name: "Amazon Balance", emoji: "<:amazon:1477203629957058570>" },
    { name: "Apple Credit", emoji: "<:apple:1477203898023280730>" },
    { name: "Gift Card", emoji: "<:giftcard:1477148273658564791>" },
    { name: "Rewarble Giftcard", emoji: "<:rewarble:1477203677403025479>" },
    { name: "Store Credit", emoji: "<:cash:1278031309129777266>" }
];

function randomPayment() {
    return PAYMENT_METHODS[random(0, PAYMENT_METHODS.length - 1)];
}

// ---------- Extras ----------

function randomOrderId() {
    return `SC-${random(100000, 999999)}`;
}

function randomTicketTime() {
    const mins = random(1, 60);
    return mins === 60 ? "1 hour" : `${mins} minute${mins > 1 ? "s" : ""}`;
}

// ---------- Console Timer ----------

let nextSendAt = null;
let countdownInterval = null;

function startCountdown(ms) {
    nextSendAt = Date.now() + ms;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        const remaining = nextSendAt - Date.now();
        if (remaining <= 0) return;

        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);

        process.stdout.write(
            `\r[NEXT] Sending next order in ${m}m ${s.toString().padStart(2, "0")}s   `
        );
    }, 1000);
}

// ---------- Core ----------

async function sendPurchaseMessage() {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || !channel.isTextBased()) return;

        const robux = randomRobuxAmount();
        const stars = randomStars();
        const starDisplay = "⭐".repeat(stars);

        const customer = randomCustomer();
        const payment = randomPayment();
        const orderId = randomOrderId();
        const ticketTime = randomTicketTime();

        // Randomly decide if the ticket message should say ":speech_balloon: Purchased in DM's"
        const ticketMessage = Math.random() < 0.5 ? "Purchased In DM's" : `Answered in **${ticketTime}**`;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({
                name: "Softcryings • Purchase Confirmation",
                iconURL: THUMBNAIL_URL
            })
            .setDescription(
                `✨ ** A new order has just been completed!**\n\n` +
                `👤 **Customer**\n${customer}\n\n` +
                `🧾 **Order Information**\n• Order ID: **${orderId}**\n` +
                `• ${(robux / 1000).toLocaleString()}k Robux delivered\n\n` +
                `💎 **Payment Source**\n${payment.emoji} ${payment.name}\n\n` +
                `🎫 **Support Ticket**\n${ticketMessage}\n\n` +
                `⭐ **Customer Rating**\n**${starDisplay} (${stars}/5)**\n\n` +
                `Thank you for choosing **Softcryings** — we appreciate the trust and support 💗`
            )
            .setThumbnail(THUMBNAIL_URL)
            .setFooter({ text: "Secure • Safe • Trusted" })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        console.log(
            `\n[SENT] ${orderId} | ${(robux / 1000).toLocaleString()}k | ${starDisplay} | ${customer}`
        );

    } catch (err) {
        console.error("\n[ERROR]", err);
    }

    const delay = randomDelay();
    startCountdown(delay);
    setTimeout(sendPurchaseMessage, delay);
}

// ---------- Console Commands ----------

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on("line", async (input) => {
    const cmd = input.trim().toLowerCase();

    if (cmd === "send") {
        console.log("\n[CMD] Manual send triggered");
        await sendPurchaseMessage();
    }

    if (cmd === "status") {
        if (!nextSendAt) return console.log("\n[STATUS] No timer set");
        const remaining = nextSendAt - Date.now();
        console.log(`\n[STATUS] Next send in ${Math.ceil(remaining / 1000)} seconds`);
    }

    if (cmd === "help") {
        console.log(
            "\n[COMMANDS]\n" +
            "send   → force send one order\n" +
            "status → show next scheduled send\n" +
            "help   → show commands\n"
        );
    }
});

// ---------- Startup ----------

client.once("clientReady", () => {
    console.log(`[READY] Logged in as ${client.user.tag}`);
    console.log(`[INFO] Channel ID: ${CHANNEL_ID}`);
    console.log(`[INFO] Delay range: ${MIN_DELAY / 60000}–${MAX_DELAY / 60000} minutes`);

    const delay = randomDelay();
    startCountdown(delay);
    setTimeout(sendPurchaseMessage, delay);
});

client.login(TOKEN);
