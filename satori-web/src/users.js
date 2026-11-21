import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * The server's persisted identity store: named accounts with salted+hashed
 * PINs, onboarding status, conversation ownership, and custom titles.
 *
 * PINs are never kept in plaintext — each account stores a random salt and a
 * scrypt hash of the PIN under that salt. The store lives as a JSON file in
 * the server's data directory (next to the conversation database) so it
 * survives restarts alongside the conversations.
 */

const STORE_FILE = "users.json";
const SCRYPT_KEYLEN = 64;

/** Creates the store in a data directory, loading any existing file. */
export function createUserStore(dataDir) {
  const storePath = path.join(dataDir, STORE_FILE);
  let store = { nextUserId: 1, users: [], conversations: {}, conversationTitles: {} };
  if (fs.existsSync(storePath)) {
    const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
    store = {
      ...store,
      ...parsed,
      conversations: parsed.conversations ?? {},
      conversationTitles: parsed.conversationTitles ?? {},
    };
  }

  function save() {
    fs.mkdirSync(dataDir, { recursive: true });
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2));
    fs.renameSync(tmpPath, storePath);
  }

  function toPublicUser(user) {
    return {
      id: user.id,
      name: user.name,
      // Legacy accounts created before `onboarded` existed default to true
      // so existing users who delete all chats are not forced into onboarding.
      onboarded: user.onboarded ?? true,
    };
  }

  /** Hashes a PIN under a fresh random salt. Returns {salt, hash} hex strings. */
  function hashPin(pin) {
    const salt = randomBytes(16);
    const hash = scryptSync(pin, salt, SCRYPT_KEYLEN);
    return { salt: salt.toString("hex"), hash: hash.toString("hex") };
  }

  /** Constant-time comparison of a PIN against a stored salted hash. */
  function pinMatches(pin, saltHex, hashHex) {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(pin, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  return {
    /** The store's location, for boot diagnostics. */
    get path() {
      return storePath;
    },

    /**
     * Registers a new account. `name` is stored as given (trimmed); names are
     * unique case-insensitively. Throws `{"taken": true}` when the name
     * already exists.
     */
    register(name, pin) {
      const key = name.trim().toLowerCase();
      if (store.users.some((user) => user.name.toLowerCase() === key)) {
        const err = new Error("Name already taken");
        err.taken = true;
        throw err;
      }
      const { salt, hash } = hashPin(pin);
      const user = {
        id: store.nextUserId++,
        name: name.trim(),
        pinSalt: salt,
        pinHash: hash,
        onboarded: false,
      };
      store.users.push(user);
      save();
      return toPublicUser(user);
    },

    /** Signs in by name (case-insensitive) and PIN; null when either is wrong. */
    verify(name, pin) {
      if (typeof pin !== "string") return null;
      const key = String(name ?? "").trim().toLowerCase();
      const user = store.users.find((candidate) => candidate.name.toLowerCase() === key);
      if (!user) return null;
      if (!pinMatches(pin, user.pinSalt, user.pinHash)) return null;
      return toPublicUser(user);
    },

    /** Looks up an account by id; null when unknown. */
    userById(id) {
      const user = store.users.find((candidate) => candidate.id === id);
      return user ? toPublicUser(user) : null;
    },

    /** Marks a user as having completed/started initial onboarding. */
    markOnboarded(userId) {
      const user = store.users.find((candidate) => candidate.id === userId);
      if (!user) return false;
      if (user.onboarded !== true) {
        user.onboarded = true;
        save();
      }
      return true;
    },

    /** Records which user owns a durable conversation. */
    ownConversation(conversationId, userId) {
      store.conversations[String(conversationId)] = userId;
      save();
    },

    /** Owned numeric conversation IDs for `userId`, sorted newest-first. */
    ownedConversationIds(userId) {
      return Object.entries(store.conversations)
        .filter(([, ownerId]) => ownerId === userId)
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id) && id >= 1)
        .sort((a, b) => b - a);
    },

    /** Returns the custom title for a conversation, or null if none is set. */
    titleOf(conversationId) {
      return store.conversationTitles[String(conversationId)] ?? null;
    },

    /** Sets a custom title for an owned conversation. */
    renameConversation(conversationId, userId, title) {
      if (!this.owns(conversationId, userId)) return false;
      store.conversationTitles[String(conversationId)] = title;
      save();
      return true;
    },

    /** Removes ownership and any custom title for a conversation. */
    deleteConversation(conversationId, userId) {
      if (!this.owns(conversationId, userId)) return false;
      const key = String(conversationId);
      delete store.conversations[key];
      delete store.conversationTitles[key];
      save();
      return true;
    },

    /** The owner of a conversation, or null for unknown/pre-auth conversations. */
    ownerOf(conversationId) {
      const ownerId = store.conversations[String(conversationId)];
      return ownerId === undefined ? null : ownerId;
    },

    /** True when `userId` owns the conversation. */
    owns(conversationId, userId) {
      return this.ownerOf(conversationId) === userId;
    },
  };
}
