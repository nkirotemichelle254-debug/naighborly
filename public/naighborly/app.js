const STORAGE_KEY = "naighborly-user-posts";
const THREADS_KEY = "naighborly-message-threads";
const DRAFT_KEY = "naighborly-create-draft";
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;
const MAX_PHOTO_STORAGE_BYTES = 7 * 1024 * 1024;
const POST_LIMITS = {
  title: 80,
  description: 700,
  location: 48,
  phone: 18,
};
const CURRENT_USER = {
  name: "Michael Heri",
  initials: "MH",
};

const basePosts = [
  {
    id: "office-chair-available",
    title: "Office chair available",
    description: "Good condition, free pick up",
    details:
      "Comfortable office chair in solid condition. Ideal for a home desk setup, study corner, or shared workspace.",
    category: "Item",
    intent: "Offer",
    location: "Westlands",
    tone: "charcoal",
    width: "82%",
    owner: "Sarah Kamau",
    ownerInitials: "SK",
    time: "10 mins ago",
    allowCalls: true,
    phone: "+254700100101",
    note: "Meet near a public pickup point and confirm the item condition before taking it home.",
  },
  {
    id: "plumbing-services-offered",
    title: "Plumbing services offered",
    description: "Professional plumber, affordable rates",
    details:
      "I help with kitchen leaks, sink fittings, tap replacements, and quick weekend plumbing fixes around the area.",
    category: "Service",
    intent: "Offer",
    location: "Kilimani",
    tone: "blue",
    width: "92%",
    owner: "David Otieno",
    ownerInitials: "DO",
    time: "24 mins ago",
    allowCalls: true,
    phone: "+254700200202",
    note: "Share clear photos of the issue before booking to save time for both sides.",
  },
  {
    id: "book-swap-psychology-novels",
    title: "Book swap - Psychology novels",
    description: "Looking to exchange fiction books",
    details:
      "Open to swapping clean psychology, self-development, or fiction titles. Happy to compare reading lists before meeting.",
    category: "Swap",
    intent: "Offer",
    location: "Lavington",
    tone: "gold",
    width: "96%",
    owner: "Grace Wanjiru",
    ownerInitials: "GW",
    time: "50 mins ago",
    allowCalls: false,
    phone: "+254700300303",
    note: "For swaps, agree on the exact titles and condition before you meet.",
  },
  {
    id: "need-laptop-charger-urgently",
    title: "Need laptop charger urgently",
    description: "HP laptop charger, willing to pay",
    details:
      "My charger failed today and I need a compatible HP charger urgently. I can buy it outright or swap for another useful item.",
    category: "Item",
    intent: "Request",
    location: "Parklands",
    tone: "charcoal",
    width: "100%",
    urgent: true,
    owner: "Michael Heri",
    ownerInitials: "MH",
    time: "2 hours ago",
    allowCalls: false,
    phone: "+254700400404",
    note: "Urgent requests work best when you include a clear model or compatibility photo.",
  },
  {
    id: "childrens-books-bundle",
    title: "Children's books bundle",
    description: "Great condition, ages 5-10",
    details:
      "A bundle of storybooks in good condition for young readers. Happy to hand them over to a family, school, or reading club.",
    category: "Item",
    intent: "Offer",
    location: "Karen",
    tone: "charcoal",
    width: "86%",
    owner: "James Mwangi",
    ownerInitials: "JM",
    time: "3 hours ago",
    allowCalls: false,
    phone: "+254700500505",
    note: "Double-check pickup timing with the owner so the handoff stays smooth.",
  },
  {
    id: "garden-maintenance",
    title: "Garden maintenance",
    description: "Weekly garden care and landscaping",
    details:
      "Available for routine garden care, pruning, watering plans, and light landscaping support for busy households.",
    category: "Service",
    intent: "Offer",
    location: "Runda",
    tone: "blue",
    width: "90%",
    owner: "Joy Njeri",
    ownerInitials: "JN",
    time: "Today",
    allowCalls: true,
    phone: "+254700600606",
    note: "For services, agree on scope, timing, and any materials before the job starts.",
  },
  {
    id: "kitchen-appliances-swap",
    title: "Kitchen appliances swap",
    description: "Blender for food processor",
    details:
      "I have a working blender and would like to exchange it for a compact food processor. Open to discussing condition and top-up.",
    category: "Swap",
    intent: "Offer",
    location: "Westlands",
    tone: "gold",
    width: "88%",
    owner: "Akinyi Achieng",
    ownerInitials: "AA",
    time: "Today",
    allowCalls: false,
    phone: "+254700700707",
    note: "Test both appliances in person when possible before completing the swap.",
  },
  {
    id: "looking-for-a-tutor",
    title: "Looking for a tutor",
    description: "Math tutor for high school student",
    details:
      "Looking for a reliable tutor for regular math sessions after school. Prefer someone patient, consistent, and nearby.",
    category: "Service",
    intent: "Request",
    location: "Kileleshwa",
    tone: "blue",
    width: "84%",
    owner: "Brian Kimani",
    ownerInitials: "BK",
    time: "Yesterday",
    allowCalls: false,
    phone: "+254700800808",
    note: "Ask for experience level, availability, and learning goals before confirming tutoring sessions.",
  },
];

const conversations = [
  {
    id: "office-chair-thread",
    postId: "office-chair-available",
    preview: "Re: Office chair available",
    time: "10m",
    unread: false,
    messages: [
      { sender: "received", text: "Hi, is the office chair available?" },
      { sender: "sent", text: "Yes, it is. What condition were you hoping for?" },
      { sender: "received", text: "Good. Can I come by tomorrow?" },
      { sender: "sent", text: "Sure, let's confirm a public pickup point in town." },
    ],
  },
  {
    id: "plumbing-thread",
    postId: "plumbing-services-offered",
    preview: "Can plumbing services work tomorrow?",
    time: "1h",
    unread: true,
    messages: [
      { sender: "received", text: "Can plumbing services work tomorrow?" },
      { sender: "sent", text: "Yes, I have an opening after 10am." },
      { sender: "received", text: "Perfect. I will send a photo of the leak first." },
    ],
  },
  {
    id: "book-swap-thread",
    postId: "book-swap-psychology-novels",
    preview: "Re: Book swap - Psychology novels",
    time: "3pm",
    unread: false,
    messages: [
      { sender: "received", text: "I have two clean fiction titles if you're still swapping." },
      { sender: "sent", text: "Yes, send them through and I can compare with mine." },
    ],
  },
  {
    id: "tutor-thread",
    postId: "looking-for-a-tutor",
    preview: "Is your tutor post still open?",
    time: "Yesterday",
    unread: false,
    messages: [
      { sender: "received", text: "Is your tutor post still open?" },
      { sender: "sent", text: "Yes, still looking for someone nearby with weekday availability." },
    ],
  },
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getToneForCategory(category) {
  if (category === "Service") return "blue";
  if (category === "Swap") return "gold";
  return "charcoal";
}

function safeReadArray(key) {
  const parsed = safeReadJson(key, []);
  return Array.isArray(parsed) ? parsed : [];
}

function safeReadJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeWriteArray(key, items) {
  return safeWriteJson(key, Array.isArray(items) ? items : []);
}

function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

function normalizePost(post) {
  if (!post || typeof post !== "object") return null;
  const title = String(post.title || "Untitled post").trim().slice(0, POST_LIMITS.title);
  const category = ["Item", "Service", "Swap"].includes(formatLabel(post.category)) ? formatLabel(post.category) : "Item";
  const intent = ["Offer", "Request"].includes(formatLabel(post.intent)) ? formatLabel(post.intent) : "Offer";
  const owner = String(post.owner || CURRENT_USER.name).trim() || CURRENT_USER.name;
  const id = String(post.id || slugify(title) || `post-${Date.now()}`).trim();
  const photos = Array.isArray(post.photos)
    ? post.photos.filter((src) => typeof src === "string" && src.startsWith("data:image/")).slice(0, MAX_PHOTOS)
    : [];

  return {
    id,
    title,
    description: String(post.description || "").trim().slice(0, POST_LIMITS.description),
    details: String(post.details || post.description || "").trim().slice(0, POST_LIMITS.description),
    category,
    intent,
    location: String(post.location || "Nairobi").trim().slice(0, POST_LIMITS.location),
    tone: post.tone || getToneForCategory(category),
    width: post.width || "100%",
    photos,
    urgent: Boolean(post.urgent),
    owner,
    ownerInitials: post.ownerInitials || getInitials(owner),
    time: post.time || "Just now",
    allowCalls: Boolean(post.allowCalls),
    phone: String(post.phone || "").trim().slice(0, POST_LIMITS.phone),
    note: post.note || "Confirm the exact item, service, or swap terms before meeting in person.",
    status: post.status,
  };
}

function validatePostDraft({ title, description, location, allowCalls, phone, photos, photosRequired }) {
  const trimmedTitle = String(title || "").trim();
  const trimmedDescription = String(description || "").trim();
  const trimmedLocation = String(location || "").trim();
  const trimmedPhone = String(phone || "").trim();
  const photoList = [...(photos || [])];

  if (trimmedTitle.length < 4) return { valid: false, message: "Add a clear title with at least 4 characters." };
  if (trimmedDescription.length < 12) return { valid: false, message: "Add a short description with at least 12 characters." };
  if (trimmedLocation.length < 2) return { valid: false, message: "Add a neighborhood or pickup area." };
  if (allowCalls && !/^\+?[0-9\s-]{7,18}$/.test(trimmedPhone)) {
    return { valid: false, message: "Add a valid phone number or switch calls off." };
  }
  if (photosRequired && !photoList.length) return { valid: false, message: "Add at least one photo for item offers." };
  if (photoList.length > MAX_PHOTOS) return { valid: false, message: "Add up to 4 photos only." };
  if (photoList.some((file) => !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES)) {
    return { valid: false, message: "Choose image files under 2.5MB each." };
  }
  if (photoList.reduce((total, file) => total + file.size, 0) > MAX_PHOTO_STORAGE_BYTES) {
    return { valid: false, message: "Use fewer photos so the post can be saved on this device." };
  }

  return { valid: true, message: "" };
}

function getPostById(postId) {
  const normalizedId = String(postId || "").trim();
  if (!normalizedId) return null;
  return getAllFeedPosts().find((post) => post.id === normalizedId) || null;
}

function readFilesAsDataUrls(fileList) {
  const files = [...(fileList || [])].slice(0, MAX_PHOTOS);
  if (!files.length) return Promise.resolve([]);

  const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES);
  if (invalidFile) {
    return Promise.reject(new Error("Photos must be images under 2.5MB each."));
  }

  if (files.reduce((total, file) => total + file.size, 0) > MAX_PHOTO_STORAGE_BYTES) {
    return Promise.reject(new Error("Photo selection is too large to save locally."));
  }

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(file);
        }),
    ),
  ).then((results) => results.filter(Boolean));
}

function getUserPosts(userName = CURRENT_USER.name) {
  const ownedPosts = getAllFeedPosts().filter((post) => post.owner === userName);
  const seenIds = new Set();

  return ownedPosts
    .filter((post) => {
      if (!post?.id || seenIds.has(post.id)) return false;
      seenIds.add(post.id);
      return true;
    })
    .map((post) => ({
      ...post,
      status: post.status || (post.urgent ? "Urgent" : "Live"),
    }));
}

function readStoredPosts() {
  return safeReadArray(STORAGE_KEY).map(normalizePost).filter(Boolean);
}

function writeStoredPosts(posts) {
  return safeWriteArray(STORAGE_KEY, posts.map(normalizePost).filter(Boolean));
}

function getAllFeedPosts() {
  const seenIds = new Set();
  return [...readStoredPosts(), ...basePosts.map(normalizePost).filter(Boolean)].filter((post) => {
    if (!post.id || seenIds.has(post.id)) return false;
    seenIds.add(post.id);
    return true;
  });
}

function getProfilePosts() {
  return getUserPosts();
}

function navigateToPost(post) {
  window.location.href = `details.html?post=${encodeURIComponent(post.id)}`;
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = `feed-card feed-card--${post.tone}${post.urgent ? " is-urgent" : ""}`;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `${post.title}, open details`);
  card.style.setProperty("--card-width", post.width || "100%");
  card.innerHTML = `
    <div class="feed-card__tags">
      <span class="feed-card__pill feed-card__pill--category">${escapeHtml(post.category)}</span>
      <span class="feed-card__pill feed-card__pill--intent${post.intent === "Request" ? " is-request" : ""}">${escapeHtml(post.intent)}</span>
      ${post.urgent ? '<span class="feed-card__alert" aria-hidden="true">!</span>' : ""}
    </div>
    <h3 class="feed-card__title">${escapeHtml(post.title)}</h3>
    <p class="feed-card__description">${escapeHtml(post.description)}</p>
    <div class="feed-card__location">${escapeHtml(post.location)}</div>
  `;

  card.addEventListener("click", () => navigateToPost(post));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToPost(post);
    }
  });

  return card;
}

function renderFeeds(filterValue = "") {
  const desktopFeed = document.getElementById("desktop-feed");
  const homeFeed = document.getElementById("home-feed");
  const targets = [desktopFeed, homeFeed].filter(Boolean);
  if (!targets.length) return;

  const query = filterValue.trim().toLowerCase();
  const posts = getAllFeedPosts().filter((post) => {
    if (!query) return true;
    return [post.title, post.description, post.category, post.intent, post.location]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  targets.forEach((target) => {
    target.innerHTML = "";
    if (!posts.length) {
      target.innerHTML = `
        <article class="surface-panel feed-empty-state">
          <strong>No matching posts yet</strong>
          <p>Try a different search phrase or create a new community post.</p>
        </article>
      `;
      return;
    }

    posts.forEach((post) => {
      target.appendChild(createPostCard(post));
    });
  });
}

function setupHomeSearch() {
  const input = document.querySelector(".home-search input");
  if (!input) return;

  input.addEventListener("input", () => {
    renderFeeds(input.value);
  });
}

function buildConversationFromPost(post, overrides = {}) {
  const safeMessages = Array.isArray(overrides.messages)
    ? overrides.messages
        .filter((message) => message && ["sent", "received"].includes(message.sender) && String(message.text || "").trim())
        .map((message) => ({ sender: message.sender, text: String(message.text).trim().slice(0, 500) }))
    : [];
  return {
    id: overrides.id || `thread-${post.id}`,
    postId: post.id,
    initials: overrides.initials || post.ownerInitials || getInitials(post.owner),
    name: overrides.name || post.owner,
    preview: overrides.preview || `Re: ${post.title}`,
    time: overrides.time || post.time || "Now",
    unread: Boolean(overrides.unread),
    messages:
      safeMessages.length
        ? safeMessages
        :
      [
        {
          sender: "received",
          text:
            post.intent === "Request"
              ? `Hi, I saw your post for "${post.title}". Is the request still open?`
              : `Hi, is "${post.title}" still available?`,
        },
        {
          sender: "sent",
          text: post.allowCalls
            ? "Yes, it is. Happy to continue here or on a quick call."
            : "Yes, it is. Happy to continue here in messages.",
        },
      ],
  };
}

function readStoredThreads() {
  return safeReadArray(THREADS_KEY)
    .filter((thread) => thread?.id && thread?.postId)
    .map((thread) => ({
      ...thread,
      id: String(thread.id),
      postId: String(thread.postId),
      messages: Array.isArray(thread.messages) ? thread.messages : [],
    }));
}

function writeStoredThreads(threads) {
  return safeWriteArray(
    THREADS_KEY,
    threads
      .map((thread) => {
        const post = getPostById(thread.postId);
        return post ? buildConversationFromPost(post, thread) : null;
      })
      .filter(Boolean),
  );
}

function ensureThreadForPost(postId) {
  const post = getPostById(postId);
  if (!post) return null;
  const storedThreads = readStoredThreads();
  const existing = storedThreads.find((thread) => thread.postId === post.id);
  if (existing) return buildConversationFromPost(post, existing);
  const newThread = buildConversationFromPost(post, { id: `thread-${post.id}`, time: "New" });
  if (!writeStoredThreads([newThread, ...storedThreads])) return null;
  return newThread;
}

function getConversationThreads() {
  const storedThreads = readStoredThreads();
  const seedThreads = conversations.filter(
    (thread) => !storedThreads.some((storedThread) => storedThread.postId === thread.postId),
  );
  const threads = [...storedThreads, ...seedThreads]
    .map((thread) => {
      const post = getPostById(thread.postId);
      return post ? buildConversationFromPost(post, thread) : null;
    })
    .filter(Boolean);

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post");

  if (postId && !threads.some((thread) => thread.postId === postId)) {
    const thread = ensureThreadForPost(postId);
    if (thread) threads.unshift(thread);
  }

  return threads;
}

function createConversationRow(item, isActive = false) {
  const row = document.createElement("article");
  row.className = `conversation-row${isActive ? " active" : ""}`;
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `Open conversation with ${item.name}`);
  row.innerHTML = `
    <div class="avatar tiny">${escapeHtml(item.initials)}</div>
    <div class="conversation-meta">
      <strong>${escapeHtml(item.name)}</strong>
      <div class="conversation-preview">${escapeHtml(item.preview)}</div>
    </div>
    <div>
      <div class="conversation-time">${escapeHtml(item.time)}</div>
      ${item.unread ? '<div class="unread-dot"></div>' : ""}
    </div>
  `;
  return row;
}

function renderThreadMessages(root, messages, limit = messages.length) {
  if (!root) return;
  root.innerHTML = "";

  messages.slice(0, limit).forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${message.sender}`;
    bubble.textContent = message.text;
    root.appendChild(bubble);
  });
}

function renderConversationThread(thread) {
  const threadAvatar = document.getElementById("thread-avatar");
  const threadName = document.getElementById("thread-name");
  const threadMessages = document.getElementById("thread-messages");
  const mobileThreadAvatar = document.getElementById("mobile-thread-avatar");
  const mobileThreadName = document.getElementById("mobile-thread-name");
  const mobileThreadMessages = document.getElementById("mobile-thread-messages");

  if (threadAvatar) {
    threadAvatar.textContent = thread.initials;
  }

  if (threadName) {
    threadName.textContent = thread.name;
  }

  if (mobileThreadAvatar) {
    mobileThreadAvatar.textContent = thread.initials;
  }

  if (mobileThreadName) {
    mobileThreadName.textContent = thread.name;
  }

  renderThreadMessages(threadMessages, thread.messages);
  renderThreadMessages(mobileThreadMessages, thread.messages, Math.min(thread.messages.length, 3));
}

function persistThreadMessage(thread, text) {
  const messageText = String(text || "").trim().slice(0, 500);
  if (!thread || !messageText) return false;
  const updatedThread = {
    ...thread,
    preview: messageText,
    time: "Now",
    unread: false,
    messages: [...thread.messages, { sender: "sent", text: messageText }],
  };
  const storedThreads = readStoredThreads().filter((item) => item.id !== updatedThread.id);
  if (!writeStoredThreads([updatedThread, ...storedThreads])) {
    window.alert("This message could not be saved on this device.");
    return false;
  }
  renderConversations(updatedThread.id);
  return true;
}

function updateConversationQuery(thread) {
  const url = new URL(window.location.href);
  url.searchParams.set("thread", thread.id);
  url.searchParams.set("post", thread.postId);
  window.history.replaceState({}, "", url);
}

function renderConversations(selectedThreadId = "") {
  const root = document.getElementById("conversation-list");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const threads = getConversationThreads();
  const activeThread =
    threads.find((thread) => thread.id === selectedThreadId) ||
    threads.find((thread) => thread.id === params.get("thread")) ||
    threads.find((thread) => thread.postId === params.get("post")) ||
    threads[0];

  if (!activeThread) {
    root.innerHTML = `
      <article class="feed-empty-state">
        <strong>No messages yet</strong>
        <p>Start by messaging a neighbor from any post to open a thread here.</p>
      </article>
    `;
    return;
  }

  root.innerHTML = "";
  threads.forEach((thread) => {
    const row = createConversationRow(thread, thread.id === activeThread.id);
    const selectThread = () => {
      renderConversations(thread.id);
    };

    row.addEventListener("click", selectThread);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectThread();
      }
    });
    root.appendChild(row);
  });

  renderConversationThread(activeThread);
  updateConversationQuery(activeThread);
  const messageBox = document.querySelector(".message-box");
  if (messageBox && !messageBox.dataset.bound) {
    messageBox.dataset.bound = "true";
    messageBox.addEventListener("submit", (event) => event.preventDefault());
    const input = messageBox.querySelector("input");
    const button = messageBox.querySelector("button");
    const send = () => {
      const latestThread = getConversationThreads().find((thread) => thread.id === new URLSearchParams(window.location.search).get("thread"));
      if (persistThreadMessage(latestThread || activeThread, input?.value)) input.value = "";
    };
    button?.addEventListener("click", send);
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        send();
      }
    });
  }
}

function createProfilePost(post) {
  const statusLabel = post.status || (post.urgent ? "Urgent" : post.intent);
  const card = document.createElement("article");
  card.className = `profile-post-card profile-post-card--${post.tone}${post.urgent ? " is-urgent" : ""}`;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `${post.title}, open details`);
  card.innerHTML = `
    <div class="profile-post-card__header">
      <span class="profile-post-card__tag">${escapeHtml(post.category)}</span>
      <span class="profile-post-card__status${statusLabel === "Urgent" || statusLabel === "Request" ? " is-request" : ""}">${escapeHtml(statusLabel)}</span>
    </div>
    <h3 class="profile-post-card__title">${escapeHtml(post.title)}</h3>
    <p class="profile-post-card__meta">${escapeHtml(post.description || `${post.intent} in ${post.location}`)}</p>
  `;

  card.addEventListener("click", () => {
    if (!post.id) return;
    navigateToPost(post);
  });

  card.addEventListener("keydown", (event) => {
    if (!post.id) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToPost(post);
    }
  });

  return card;
}

function renderProfilePosts() {
  const root = document.getElementById("profile-posts");
  if (!root) return;

  const posts = getProfilePosts();
  const profilePostCount = document.getElementById("profile-post-count");
  const profileLiveCount = document.getElementById("profile-live-count");
  const profileUrgentCount = document.getElementById("profile-urgent-count");

  if (profilePostCount) {
    profilePostCount.textContent = String(posts.length);
  }

  if (profileLiveCount) {
    profileLiveCount.textContent = String(posts.filter((post) => post.intent === "Offer").length);
  }

  if (profileUrgentCount) {
    profileUrgentCount.textContent = String(posts.filter((post) => post.urgent).length);
  }

  root.innerHTML = "";
  if (!posts.length) {
    root.innerHTML = `
      <article class="feed-empty-state profile-empty-state">
        <strong>No posts yet</strong>
        <p>Create your first Naighborly listing and it will show up here instantly.</p>
      </article>
    `;
    return;
  }

  posts.forEach((post) => {
    root.appendChild(createProfilePost(post));
  });
}

function setupCreateFlows() {
  document.querySelectorAll("[data-create-flow]").forEach((flow) => {
    const steps = [...flow.querySelectorAll(".create-step")];
    const pills = [...flow.querySelectorAll("[data-step-pill]")];
    const prevButton = flow.querySelector("[data-prev-step]");
    const nextButton = flow.querySelector("[data-next-step]");
    const actions = flow.querySelector("[data-flow-actions]");
    const backLink = flow.querySelector("[data-flow-back]");
    const photoInput = flow.querySelector("[data-photo-input]");
    const photoText = flow.querySelector("[data-photo-text]");
    const photoRequirement = flow.querySelector("[data-photo-requirement]");
    const titleInput = flow.querySelector("[data-create-title]");
    const descriptionInput = flow.querySelector("[data-create-description]");
    const locationInput = flow.querySelector("[data-create-location]");
    const callToggle = flow.querySelector("[data-call-toggle]");
    const callField = flow.querySelector("[data-call-field]");
    const phoneInput = flow.querySelector("[data-call-phone]");
    const urgentToggle = flow.querySelector("[data-urgent-toggle]");
    let currentStep = 1;

    [
      [titleInput, POST_LIMITS.title],
      [descriptionInput, POST_LIMITS.description],
      [locationInput, POST_LIMITS.location],
      [phoneInput, POST_LIMITS.phone],
    ].forEach(([field, limit]) => field?.setAttribute("maxlength", String(limit)));

    function getSelectedValue(group) {
      return flow.querySelector(`[data-choice-group="${group}"].is-selected`)?.dataset.value || "";
    }

    function photosAreRequired() {
      return getSelectedValue("intent") === "offer" && getSelectedValue("category") === "item";
    }

    function isFinalStepValid() {
      const hasCoreText = validatePostDraft({
        title: titleInput?.value,
        description: descriptionInput?.value,
        location: locationInput?.value,
        allowCalls: callToggle?.checked,
        phone: phoneInput?.value,
        photos: photoInput?.files,
        photosRequired: photosAreRequired(),
      }).valid;
      if (!hasCoreText) return false;
      return true;
    }

    function readDraft() {
      try {
        return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}");
      } catch {
        return {};
      }
    }

    function writeDraft() {
      const draft = {
        category: getSelectedValue("category"),
        intent: getSelectedValue("intent"),
        title: titleInput?.value || "",
        description: descriptionInput?.value || "",
        location: locationInput?.value || "",
        allowCalls: Boolean(callToggle?.checked),
        phone: phoneInput?.value || "",
        urgent: Boolean(urgentToggle?.checked),
      };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore draft persistence errors.
      }
    }

    function clearDraft() {
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore storage errors.
      }
    }

    function syncPhotoLabel() {
      if (!photoText || !photoInput) return;
      photoText.textContent = photoInput.files?.length
        ? `${photoInput.files.length} photo${photoInput.files.length === 1 ? "" : "s"} selected`
        : "Click to upload photos";
    }

    function syncPhotoRequirement() {
      if (!photoRequirement) return;
      const isRequired = photosAreRequired();
      photoRequirement.textContent = isRequired ? "*required for item offers" : "optional";
      photoRequirement.classList.toggle("is-optional", !isRequired);
    }

    function syncCallField() {
      if (!callField) return;
      callField.hidden = !callToggle?.checked;

      if (phoneInput) {
        phoneInput.required = Boolean(callToggle?.checked);
      }
    }

    function syncActionState() {
      const canProceed =
        currentStep === 1
          ? Boolean(getSelectedValue("category"))
          : currentStep === 2
            ? Boolean(getSelectedValue("intent"))
            : isFinalStepValid();

      if (nextButton) {
        nextButton.disabled = !canProceed;
        nextButton.classList.toggle("is-disabled", !canProceed);
      }
    }

    function renderStep() {
      steps.forEach((step, index) => {
        step.classList.toggle("active", index + 1 === currentStep);
      });

      pills.forEach((pill, index) => {
        pill.classList.toggle("active", index + 1 <= currentStep);
      });

      const isFinal = currentStep === 3;
      actions?.classList.toggle("is-final", isFinal);
      actions?.classList.toggle("flow-actions--single", !isFinal);

      if (prevButton) {
        prevButton.hidden = !isFinal;
      }

      if (nextButton) {
        nextButton.textContent = isFinal ? "Post to Naighborly" : "Continue";
      }

      syncActionState();
    }

    function moveToPreviousStep() {
      currentStep = Math.max(1, currentStep - 1);
      renderStep();
    }

    flow.querySelectorAll("[data-choice-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const selector = `[data-choice-group="${button.dataset.choiceGroup}"]`;
        flow.querySelectorAll(selector).forEach((item) => {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
        syncPhotoRequirement();
        syncActionState();
        writeDraft();
      });
    });

    [titleInput, descriptionInput, locationInput, phoneInput].forEach((field) => {
      field?.addEventListener("input", () => {
        syncActionState();
        writeDraft();
      });
    });

    photoInput?.addEventListener("change", () => {
      const invalidFile = [...(photoInput.files || [])].find(
        (file) => !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES,
      );
      if (invalidFile) {
        photoInput.value = "";
        window.alert("Choose image files under 2.5MB each. You can add up to 4 photos.");
      }
      syncPhotoLabel();
      syncActionState();
    });

    callToggle?.addEventListener("change", () => {
      syncCallField();
      syncActionState();
      writeDraft();
    });

    urgentToggle?.addEventListener("change", () => {
      writeDraft();
    });

    backLink?.addEventListener("click", (event) => {
      if (currentStep === 1) return;
      event.preventDefault();
      moveToPreviousStep();
    });

    prevButton?.addEventListener("click", moveToPreviousStep);

    nextButton?.addEventListener("click", async () => {
      if (nextButton.disabled) return;

      if (currentStep < 3) {
        currentStep += 1;
        renderStep();
        return;
      }

      const category = formatLabel(getSelectedValue("category"));
      const intent = formatLabel(getSelectedValue("intent"));
      const validation = validatePostDraft({
        title: titleInput.value,
        description: descriptionInput.value,
        location: locationInput.value,
        allowCalls: callToggle?.checked,
        phone: phoneInput?.value,
        photos: photoInput?.files,
        photosRequired: photosAreRequired(),
      });
      if (!validation.valid) {
        window.alert(validation.message);
        syncActionState();
        return;
      }
      const existingStoredPosts = readStoredPosts();
      const baseId = slugify(titleInput.value) || `post-${Date.now()}`;
      const allPostIds = new Set(getAllFeedPosts().map((post) => post.id));
      const postId = allPostIds.has(baseId) ? `${baseId}-${Date.now()}` : baseId;
      const allowCalls = Boolean(callToggle?.checked);
      const originalButtonText = nextButton.textContent;

      nextButton.disabled = true;
      nextButton.classList.add("is-disabled");
      nextButton.textContent = "Publishing...";

      try {
        const photos = await readFilesAsDataUrls(photoInput?.files);
        const newPost = {
          id: postId,
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          details: descriptionInput.value.trim(),
          category,
          intent,
          location: locationInput.value.trim(),
          tone: getToneForCategory(category),
          width: "100%",
          photos,
          urgent: Boolean(urgentToggle?.checked),
          owner: CURRENT_USER.name,
          ownerInitials: CURRENT_USER.initials,
          time: "Just now",
          allowCalls,
          phone: allowCalls ? phoneInput?.value.trim() || "" : "",
          note:
            intent === "Request"
              ? "Be specific about what help you need so neighbors can respond faster."
              : "Confirm the exact item, service, or swap terms before meeting in person.",
        };

        writeStoredPosts([newPost, ...existingStoredPosts]);
        clearDraft();
        window.location.href = "home.html?published=1";
      } catch {
        nextButton.textContent = originalButtonText;
        syncActionState();
        window.alert("We could not save the photos for this post. Try fewer or smaller images.");
      }
    });

    const draft = readDraft();
    if (draft.category) flow.querySelector(`[data-choice-group="category"][data-value="${draft.category}"]`)?.click();
    if (draft.intent) flow.querySelector(`[data-choice-group="intent"][data-value="${draft.intent}"]`)?.click();
    if (titleInput) titleInput.value = draft.title || "";
    if (descriptionInput) descriptionInput.value = draft.description || "";
    if (locationInput) locationInput.value = draft.location || "";
    if (callToggle) callToggle.checked = Boolean(draft.allowCalls);
    if (phoneInput) phoneInput.value = draft.phone || "";
    if (urgentToggle) urgentToggle.checked = Boolean(draft.urgent);

    syncPhotoLabel();
    syncPhotoRequirement();
    syncCallField();
    renderStep();
  });
}

function renderDetailsPage() {
  const page = document.querySelector("[data-details-page]");
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post");
  const posts = getAllFeedPosts();
  const matchedPost = posts.find((item) => item.id === postId);
  const post = matchedPost || posts.find((item) => item.urgent) || posts[0];
  const content = document.getElementById("details-content");

  if (!post || (postId && !matchedPost)) {
    if (content) {
      content.innerHTML = `
        <section class="pattern-banner">
          <p>Built for everyday exchange in Nairobi</p>
          <strong>This post is no longer available</strong>
        </section>
        <article class="feed-empty-state details-empty-state">
          <strong>That link looks out of date</strong>
          <p>The post may have expired, been removed, or the URL may be incomplete. Head back to the home feed to keep browsing.</p>
          <div class="details-action-row">
            <a class="primary-action kitenge-button" href="home.html">Back to home</a>
            <a class="secondary-action" href="create.html">Create a post</a>
          </div>
        </article>
      `;
    }
    return;
  }

  const heroCard = document.getElementById("details-hero-card");
  const intentChip = document.getElementById("details-intent");
  const alert = document.getElementById("details-alert");
  const messageLink = document.getElementById("details-message-link");
  const callLink = document.getElementById("details-call-link");
  const actionRow = page.querySelector(".details-action-row");
  const photoStrip = document.getElementById("details-photo-strip");
  const photoGrid = document.getElementById("details-photo-grid");

  if (heroCard) {
    heroCard.className = `details-hero-card feed-card feed-card--${post.tone}${post.urgent ? " is-urgent" : ""}`;
  }

  if (photoStrip && photoGrid) {
    const photos = Array.isArray(post.photos) ? post.photos.filter(Boolean) : [];
    photoGrid.innerHTML = "";
    photoStrip.hidden = !photos.length;

    photos.forEach((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `${post.title} photo ${index + 1}`;
      image.loading = "lazy";
      photoGrid.appendChild(image);
    });
  }

  document.getElementById("details-type").textContent = post.category;
  document.getElementById("details-title").textContent = post.title;
  document.getElementById("details-description").textContent = post.details || post.description;
  document.getElementById("details-location").textContent = post.location;
  document.getElementById("details-owner").textContent = post.owner;
  document.getElementById("details-owner-initials").textContent = post.ownerInitials || getInitials(post.owner);
  document.getElementById("details-owner-meta").textContent = `${post.intent} from ${post.location}`;
  document.getElementById("details-category-meta").textContent = post.category;
  document.getElementById("details-intent-meta").textContent = post.intent;
  document.getElementById("details-time").textContent = post.time;
  document.getElementById("details-area").textContent = post.location;
  document.getElementById("details-note").textContent = post.note;

  if (intentChip) {
    intentChip.textContent = post.intent;
    intentChip.classList.toggle("is-request", post.intent === "Request");
  }

  if (alert) {
    alert.hidden = !post.urgent;
  }

  if (messageLink) {
    messageLink.textContent =
      post.intent === "Request" ? "Offer help" : post.category === "Swap" ? "Start swap" : "Message";
    messageLink.href = `inbox.html?post=${encodeURIComponent(post.id)}`;
  }

  if (callLink) {
    const canCall = Boolean(post.allowCalls && post.phone);
    callLink.hidden = !canCall;

    if (actionRow) {
      actionRow.classList.toggle("details-action-row--single", !canCall);
    }

    if (canCall) {
      callLink.textContent =
        post.category === "Swap" ? "Call owner" : post.intent === "Request" ? "Call now" : "Call";
      callLink.href = `tel:${post.phone}`;
    }
  }
}

function setupLoginForms() {
  document.querySelectorAll("[data-login-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = "home.html?welcome=1";
    });
  });
}

function setupHomeStatus() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("published")
    ? "Your post is live. Neighbors can now discover it from the home feed."
    : params.get("welcome")
      ? "Welcome back. Your neighborhood feed is ready."
      : "";

  if (!message) return;

  const banner = document.getElementById("home-status");
  if (!banner) return;
  banner.hidden = false;
  banner.textContent = message;
}

renderFeeds();
renderConversations();
renderProfilePosts();
setupCreateFlows();
renderDetailsPage();
setupHomeSearch();
setupLoginForms();
setupHomeStatus();
