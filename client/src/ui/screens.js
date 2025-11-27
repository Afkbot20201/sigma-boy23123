import { register, login, getMe, getLeaderboard, queueJoin, queueLeave } from "../api.js";
import { connectSocket } from "../netcode.js";

const root = document.getElementById("ui-root");

let currentScreen = null;
let user = null;
let socket = null;

function clearRoot() {
  root.innerHTML = "";
}

function screenLanding() {
  clearRoot();
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";

  wrapper.innerHTML = `
    <div class="panel" style="padding:2rem;max-width:420px;width:100%;">
      <h1 style="margin-top:0;font-size:1.8rem;">Arena Nemesis</h1>
      <p style="opacity:0.8;">File-backed competitive shooter built for Render free tier.</p>
      <div style="margin-top:1.5rem;display:flex;gap:0.75rem;">
        <button id="btn-login" class="button" style="flex:1;">Login</button>
        <button id="btn-register" class="button secondary" style="flex:1;">Register</button>
      </div>
    </div>
  `;

  wrapper.querySelector("#btn-login").onclick = () => {
    screenAuth("login");
  };
  wrapper.querySelector("#btn-register").onclick = () => {
    screenAuth("register");
  };

  root.appendChild(wrapper);
  currentScreen = "landing";
}

function screenAuth(mode) {
  clearRoot();
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";

  wrapper.innerHTML = `
    <div class="panel" style="padding:2rem;max-width:420px;width:100%;">
      <h1 style="margin-top:0;font-size:1.6rem;">${mode === "login" ? "Login" : "Create account"}</h1>
      <form id="auth-form" style="margin-top:1rem;display:flex;flex-direction:column;gap:0.75rem;">
        <input class="input" name="username" placeholder="Username" autocomplete="off" />
        <input class="input" name="password" type="password" placeholder="Password" autocomplete="off" />
        <button class="button" type="submit">${mode === "login" ? "Login" : "Register"}</button>
      </form>
      <button id="back" class="button secondary" style="margin-top:0.75rem;width:100%;">Back</button>
      <div id="auth-error" style="margin-top:0.5rem;color:#fb7185;font-size:0.85rem;"></div>
    </div>
  `;

  wrapper.querySelector("#back").onclick = () => {
    screenLanding();
  };

  wrapper.querySelector("#auth-form").onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const username = fd.get("username").trim();
    const password = fd.get("password").trim();
    const errorEl = wrapper.querySelector("#auth-error");
    errorEl.textContent = "";
    try {
      const fn = mode === "login" ? login : register;
      const res = await fn(username, password);
      localStorage.setItem("token", res.token);
      user = res.user;
      socket = connectSocket(res.token);
      socket.on("connect_error", err => {
        console.error("Socket error", err.message);
      });
      screenLobby();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  };

  root.appendChild(wrapper);
  currentScreen = "auth";
}

async function screenLobby() {
  clearRoot();
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.display = "grid";
  wrapper.style.gridTemplateColumns = "260px 1fr 260px";
  wrapper.style.padding = "1rem";
  wrapper.style.gap = "1rem";

  const me = await getMe();
  user = me;

  const left = document.createElement("div");
  left.className = "panel";
  left.style.padding = "1rem";
  left.innerHTML = `
    <div>
      <div style="font-size:1.1rem;font-weight:600;">${me.username}</div>
      <div style="font-size:0.9rem;opacity:0.8;">${me.rank} • ELO ${me.elo}</div>
      <div style="margin-top:0.5rem;font-size:0.85rem;">Level ${me.level} • XP ${me.xp}</div>
    </div>
    <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.4rem;">
      <button id="btn-play" class="button">Play</button>
      <button id="btn-training" class="button secondary">Training vs AI</button>
      <button id="btn-leaderboard" class="button secondary">Leaderboards</button>
      <button id="btn-settings" class="button secondary">Settings</button>
    </div>
  `;

  const center = document.createElement("div");
  center.className = "panel";
  center.style.padding = "1rem";
  center.innerHTML = `
    <h2 style="margin-top:0;">Play</h2>
    <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
      <button id="queue-casual" class="button">Casual TDM</button>
      <button id="queue-ranked" class="button secondary">Ranked TDM</button>
    </div>
    <div id="queue-status" style="font-size:0.9rem;opacity:0.8;">Not in queue.</div>
  `;

  const right = document.createElement("div");
  right.className = "panel";
  right.style.padding = "1rem";
  right.innerHTML = `
    <h3 style="margin-top:0;">Ranked Top 5</h3>
    <div id="lb-small" style="font-size:0.85rem;"></div>
  `;

  wrapper.appendChild(left);
  wrapper.appendChild(center);
  wrapper.appendChild(right);
  root.appendChild(wrapper);

  const lbSmall = right.querySelector("#lb-small");
  try {
    const lb = await getLeaderboard("ranked");
    lbSmall.innerHTML = lb.slice(0, 5).map((p, i) => `
      <div>${i + 1}. ${p.username} — ${p.rank} (${p.elo})</div>
    `).join("");
  } catch {
    lbSmall.textContent = "Failed to load leaderboard.";
  }

  const queueStatus = center.querySelector("#queue-status");
  let inQueue = false;

  center.querySelector("#queue-casual").onclick = async () => {
    if (!inQueue) {
      inQueue = true;
      queueStatus.textContent = "Queued for Casual TDM...";
      await queueJoin("casual", "tdm", null);
    } else {
      inQueue = false;
      queueStatus.textContent = "Not in queue.";
      await queueLeave();
    }
  };

  center.querySelector("#queue-ranked").onclick = async () => {
    if (!inQueue) {
      inQueue = true;
      queueStatus.textContent = "Queued for Ranked TDM...";
      await queueJoin("ranked", "tdm", null);
    } else {
      inQueue = false;
      queueStatus.textContent = "Not in queue.";
      await queueLeave();
    }
  };

  currentScreen = "lobby";
}

export function bootUi() {
  const token = localStorage.getItem("token");
  if (token) {
    socket = connectSocket(token);
    socket.on("connect", () => {
      screenLobby();
    });
    socket.on("connect_error", () => {
      screenLanding();
    });
  } else {
    screenLanding();
  }
}
