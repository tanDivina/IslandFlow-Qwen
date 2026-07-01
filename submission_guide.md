# Qwen Cloud Hackathon Submission Package: IslandFlow

This file provides a complete suite of copy-paste-ready materials, scripts, and structures for your official Devpost submission.

---

## 🏷️ Track Identification & Core Metadata
* **Submission Track:** Track 1: MemoryAgent
* **Project Title:** IslandFlow: Weather-Intelligent Eco-Tourism Concierge & MemoryAgent
* **Repository URL:** `https://github.com/tanDivina/IslandFlow-Qwen`
* **License:** MIT (detectable and visible at the root of the repository)

---

## 📝 Copy-Paste Devpost Submission Description

### **Elevator Pitch / Tagline**
An autonomous, weather-intelligent AI concierge and water transit logistics dispatcher for tropical archipelagos—utilizing Qwen Cloud models for persistent, relationship-driven cross-session memories, and Alibaba Cloud OSS for secure travel itinerary exports.

### **The Problem We Solve**
In island destinations like Bocas del Toro, Panama, eco-lodges are isolated and inter-island water transit is a necessity. However, marine logistics are highly sensitive to weather changes. Operating small open boats (*Pangas*) in sudden tropical downpours or swells over $1.5\text{m}$ presents severe safety hazards. 

When itineraries change due to storms, communications break down: guests are stranded, captains are left waiting at sea, and dispatchers are overwhelmed with manual coordinate swaps.

### **Our Solution: IslandFlow**
IslandFlow is an autonomous ecosystem designed to solve island travel coordination:
1. **The Qwen MemoryAgent**: Acts as a warm, hospitably personal eco-tourism coordinator. It builds deep, persistent cognitive profiles across sessions to remember guest allergies, activity preferences, and schedule histories.
2. **Model Context Protocol (MCP) Dispatcher**: Integrates weather forecasting tools and spatial routing rules. It automatically bypasses water transit for mainland trips and upgrades vessel sizes (to wave-fit yachts like *Aqua Express*) when waves are moderately high ($1.0\text{m} - 1.5\text{m}$).
3. **Live Captain Alerts Broadcast**: Instantly fires warnings to water taxi operators and schedules cancellations, displayed on a glowing, dark glassmorphic operator dashboard.
4. **Alibaba Cloud Object Storage Service (OSS)**: Compiles high-fidelity trip itinerary receipts and hosts them securely on Alibaba Cloud infrastructure for guest access.

### **How We Built It**
* **Frontend**: Built on React 19 + Vite, following **Hero-Apps Premium Guidelines**—delivering pitch-black backdrops, glowing neon-green overlays (`#a8ff35`), and silky smooth custom-state transition animations.
* **Backend**: Powered by FastAPI (Python), serving a custom FastMCP server, and orchestrating MongoDB collections.
* **AI Core**: Qwen-Plus models accessed via the DashScope API, configured with a zero-shot context-injection pattern for instantaneous cognitive memory retrieval.
* **Cloud Infrastructure**: Native integration with the Alibaba Cloud Object Storage Service (OSS) using the official python `oss2` SDK.

### **What We Learned / Challenges Overcome**
Establishing direct, low-latency, cross-session memories without introducing token bloat or infinite tool loops was a major engineering hurdle. We solved this by pre-fetching conversational memories from MongoDB on the backend and injecting them into the system prompt's background block. This lets Qwen make instant personalized decisions without repeating expensive database calls.

---

## 🛠️ Proof of Alibaba Cloud API & Service Usage

To verify native integration and usage of Alibaba Cloud APIs, the judges can inspect the following code files in our public repository:

1. 👉 **[backend/ali_oss.py](https://github.com/tanDivina/IslandFlow-Qwen/blob/main/backend/ali_oss.py)**
   * **Service:** **Alibaba Cloud Object Storage Service (OSS)**.
   * **Functionality:** Uses the official `oss2` Python library to establish an authenticated connection with our Singapore regional endpoint (`oss-ap-southeast-1.aliyuncs.com`), stream markdown travel itineraries dynamically as byte files, and generate secure signed URLs valid for 24 hours.

2. 👉 **[backend/agent.py](https://github.com/tanDivina/IslandFlow-Qwen/blob/main/backend/agent.py#L377-L380)**
   * **Service:** **Qwen Cloud Model Studio (compatible-mode)**.
   * **Functionality:** Dynamically routes requests through either the standard international gateway or the high-throughput Token Plan gateway depending on the configured environment.
   * **Visible URLs Supported:**
     * Standard Free Trial: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
     * Token Plan: `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`

---

## 🎬 3-Minute Demo Video Script (YouTube/Vimeo)

Make sure your video is exactly around **2:45 to 3:00 minutes**. Focus on high visual impact and clear storytelling.

### **Phase 1: The Hook (0:00 - 0:45)**
* **Visual**: Show the gorgeous premium dark UI of IslandFlow. Point out the **Stay Schedule Timeline** for Alex Mercer.
* **Voiceover**: *"Welcome to IslandFlow, a weather-intelligent concierge and dispatcher built for Track 1 of the Qwen Cloud Hackathon. We're looking at Alex Mercer's itinerary. He's staying at La Coralina resort, and has two outdoor tours booked: snorkeling at Cayos Zapatilla on May 30th, and a canopy zipline on May 31st."*

### **Phase 2: Persistent Cognitive Memory (0:45 - 1:30)**
* **Visual**: Open the chat window. Type: *"Hey, just checking in. I have a severe shellfish allergy and I prefer private, uncrowded excursions. Can you save that?"*
* **Action**: Submit the message. Watch the scroll log. Point to the **Guest Persistent Memories** card on the screen as *"Severe allergy to shellfish; prefers private, uncrowded tours"* pops up in real-time.
* **Voiceover**: *"Our Qwen-powered MemoryAgent acts autonomously. When a guest mentions persistent preferences or medical constraints, Qwen immediately calls our custom database memory tools. These profiles persist across sessions, instantly altering all future recommendations to ensure 100% personalized safety."*

### **Phase 3: Weather-Intelligent Logistics Shift & Captain Warnings (1:30 - 2:30)**
* **Visual**: Go to the **Operator Control Panel** on the bottom right.
  * Set Date: **May 30, 2026**
  * Set Weather: **Heavy Rain**
  * Set Wave Height: **1.8m** (Danger)
  * Click **Trigger Weather Shift**.
* **Action**: Show the logs console scrolling. Show the chat alert popping up from Qwen warning Alex. Show the interactive proposal card: *"Swap Cayos Zapatilla Snorkeling for Green Cacao Chocolate Workshop"*. Click **Confirm Swap**.
* **Visual**: Click on Sub-Tab 2 (**Dispatch Ledger**). Point out the glowing **Live Captain Notifications Panel** flashing in bright neon red with a cancellation broadcast.
* **Voiceover**: *"Watch what happens when sea conditions worsen. We'll simulate 1.8-meter waves on May 30th. Instantly, our FastMCP dispatcher flags the snorkeling trip as dangerous. Qwen analyzes local activities at Alex's hotel, recommends a safe indoor alternative, and presents a swap card. When we click confirm, IslandFlow updates the DB, cancels the transit dispatch, and instantly broadcasts a cancellation alarm to Captain Jose's marine radio panel."*

### **Phase 4: Alibaba Cloud OSS Export & Outro (2:30 - 3:00)**
* **Visual**: Click **Export to Alibaba Cloud OSS** button. Show a popup showing the generated download URL.
* **Voiceover**: *"Finally, our backend packages this updated schedule and uploads it natively to our Alibaba Cloud OSS bucket, giving guests a signed, secure receipt of their travels. IslandFlow combines the cognitive empathy of Qwen's MemoryAgent with raw spatial logistics to make archipelago tourism safe and stress-free. Thank you!"*

---

## 📹 Deployment Proof Video Script (60 seconds)

The rules require a *separate short recording* proving your backend is running on Alibaba Cloud. 

1. **Screen 1 (0:00 - 0:20)**: Show your **Alibaba Cloud Console** dashboard (ECS instance or Container Service page) showing your active VM/container running.
2. **Screen 2 (0:20 - 0:40)**: Open terminal and type `curl https://<your-alibaba-ip-or-domain>/api/status` to show a JSON response streaming live from your Alibaba deployment.
3. **Screen 3 (0:40 - 0:60)**: Briefly click around the live, published frontend URL hosted on your custom domain, proving that the live site is communicating directly with the Alibaba Cloud backend.

---

## 📸 Alibaba Cloud ECS Deployment & Workbench Proof (Mandatory)

The Devpost x Qwen team requires **visual evidence (a screenshot of running resources from your Alibaba Cloud Workbench)**. To easily satisfy this, follow these steps to deploy IslandFlow on an Alibaba Cloud **Elastic Compute Service (ECS)** instance and capture your winning screenshot.

### 1. Provision Your Alibaba Cloud ECS Instance
1. Log into your [Alibaba Cloud Console](https://www.alibabacloud.com/).
2. In the top search bar, search for **Elastic Compute Service (ECS)**.
3. Click **Create Instance** (choose the **Singapore** or **US** region depending on your coupon/credits).
4. **Instance Type**: Select a lightweight, affordable instance (e.g., `ecs.t6-c1m1.large` or similar burstable instance type) running **Ubuntu 22.04 LTS**.
5. **Network / Security Group**: 
   * Ensure your instance has a **Public IP Address** allocated.
   * In the Security Group rules, add inbound rules to open ports:
     * **Port `8000`** (for the FastAPI backend API).
     * **Port `5173`** (for the Vite + React frontend).

### 2. Deploy the IslandFlow Stack
Connect to your instance via the Alibaba Cloud **Workbench** (built-in browser SSH terminal) or standard SSH:
```bash
ssh root@<your-ecs-public-ip>
```

Run these commands inside your ECS terminal to clone and initialize the application:
```bash
# 1. Update OS and install Docker & Docker-Compose
apt-get update && apt-get install -y docker.io docker-compose git

# 2. Clone your hackathon repository
git clone https://github.com/tanDivina/IslandFlow-Qwen.git
cd IslandFlow-Qwen

# 3. Create your production .env inside backend/
cd backend
cp .env.example .env
nano .env  # Add your DASHSCOPE_API_KEY, ALI_OSS keys, and select the correct OPENAI_API_BASE

# 4. Spin up the self-contained docker containers
cd ..
docker-compose up -d --build
```

### 3. Capture Your Required Submission Screenshot
1. Go back to your **Alibaba Cloud Console**.
2. Navigate to **Elastic Compute Service (ECS) > Instances**.
3. Locate your running `IslandFlow` instance.
4. Click on **"Workbench"** next to the instance to open the terminal.
5. Arrange your browser window so that **both of these are visible on your screen**:
   * The **Alibaba Cloud ECS Instance Dashboard** showing your instance running in the green **"Running"** state with its public IP address clearly displayed.
   * The **Workbench SSH Session tab** showing the successful output of `docker ps` displaying active containers for `islandflow-backend` and `islandflow-frontend`.
6. Take a high-resolution screenshot. **This is your official "Proof of Deployment" screenshot** to upload to your Devpost submission questionnaire!

---

## ✍️ Optional Blog Post Draft (To win the Blog Post Prize)

**Title**: Building IslandFlow: How Qwen Cloud & Alibaba Cloud Transformed My Project into a Weather-Intelligent MemoryAgent

**Body**:
Eco-tourism is about connecting with nature, but in destinations like Bocas del Toro, Panama, nature is unpredictable. Heavy swells can turn a safe boat trip into a hazard in minutes.

During the Qwen Cloud Hackathon, I built **IslandFlow**—an autonomous AI eco-tourism concierge and water taxi dispatcher. I chose **Track 1: MemoryAgent** because I wanted to move beyond passive Q&A chats and build an agent that actively remembers guest preferences (allergies, scheduling, transit choices) across multiple days, while responding to live, real-world events.

### How Qwen Drives the Memory Loop
Using Qwen-Plus accessed via the DashScope API, I designed a zero-shot context injection mechanism. Whenever a guest converses with the concierge, Qwen extracts permanent preferences and updates MongoDB. On page reloads, these memories are pre-fetched and fed back into the reasoning loop. Qwen immediately personalizes recommendations without redundant tool calls.

### Solving Logistics with Model Context Protocol (MCP)
By binding Qwen to a FastMCP server, the agent has eyes on the water. It monitors wave heights and applies rigorous rules:
- Bypasses water taxi dispatches entirely if both resort and tour are on the mainland.
- Restricts transfers to heavy, wave-fit yachts if swells rise between 1.0m and 1.5m.
- Grounds water travel completely if waves exceed 1.5m, proposing on-site resort activities.

### Direct Proof on Alibaba Cloud OSS & ECS
To back up guest files, IslandFlow connects natively to **Alibaba Cloud Object Storage Service (OSS)**. Using the official `oss2` SDK, the Python backend compiles formatted markdown receipts of guest schedules, uploads them directly to Singapore-based OSS buckets, and returns signed download URLs valid for 24 hours.

By deploying the full application stack on **Alibaba Cloud ECS** via Docker, the dispatch system and dark-glassmorphic operator dashboard run 24/7 with direct connection to the cloud backend.

Building with Qwen Cloud has shown me that the future of AI is not in general-purpose text bots, but in deeply focused, persistent, and context-aware agents capable of managing real-world physical dispatches.
