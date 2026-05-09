# Lumora — Scalable Cloud-Native Photo Sharing Platform
**COM769 (79651) · Scalable Advanced Software Solutions · MSc Computer Science**  
**Student:** Usman · **Student Number:** [INSERT]  
**Submission Deadline:** 11 May 2026

---

## Project Summary

Lumora is a scalable, cloud-native photo-sharing web application deployed on **Microsoft Azure**. It supports two distinct user roles — **Creators** (upload, tag, manage photos) and **Consumers** (browse, search, comment, rate). The frontend is a static single-page application hosted on Azure Static Web Apps, communicating with a serverless REST API backend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│         Static HTML/CSS/JS (Azure Static Web Apps + CDN)           │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS REST Calls
┌────────────────────▼────────────────────────────────────────────────┐
│               Azure API Management (Gateway + Rate Limiting)        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────┐
        ▼                             ▼
┌───────────────┐           ┌─────────────────────┐
│ Azure          │           │ Azure Function App   │
│ Functions      │           │ (Node.js / Python)   │
│ (Auth/User)    │           │ (Photos / Comments)  │
└───────┬───────┘           └──────────┬──────────┘
        │                              │
   ┌────▼────┐                  ┌──────▼──────┐
   │ Azure   │                  │ Azure       │
   │ AD B2C  │                  │ Cosmos DB   │
   │ (Auth)  │                  │ (Metadata)  │
   └─────────┘                  └──────┬──────┘
                                       │
                                ┌──────▼──────┐
                                │ Azure Blob  │
                                │ Storage     │
                                │ (Images)    │
                                └─────────────┘
                                       │
                                ┌──────▼──────┐
                                │ Azure CDN   │
                                │ (Delivery)  │
                                └─────────────┘
```

---

## Azure Services Used

| Service | Purpose | Tier |
|---|---|---|
| **Azure Static Web Apps** | Host static HTML/CSS/JS frontend | Free |
| **Azure Functions (Consumption)** | Serverless REST API backend | Consumption (free 1M req/mo) |
| **Azure Blob Storage** | Store original + resized photos | LRS, Hot tier |
| **Azure Cosmos DB (NoSQL)** | Store user, photo, comment metadata | Free tier (1000 RU/s) |
| **Azure CDN** | Serve images globally with edge caching | Standard |
| **Azure API Management** | Gateway, rate limiting, CORS | Consumption |
| **Azure AD B2C** | User authentication & role management | Free (50K MAU) |
| **Azure Cache for Redis** | Cache trending/search results | C0 Basic |
| **Azure DNS** | Custom domain + routing | Standard |

---

## REST API Design

### Base URL
```
https://api.lumora.azurewebsites.net/api/v1
```

### Authentication
All endpoints except `GET /photos` and `GET /photos/:id` require a **Bearer token** from Azure AD B2C.

### Endpoints

#### Photos
```
GET    /photos                  List photos (paginated, filterable)
GET    /photos/:id              Get single photo + metadata
POST   /photos                  Upload new photo [Creator only]
PUT    /photos/:id              Update photo metadata [Creator/owner only]
DELETE /photos/:id              Delete photo [Creator/owner only]
```

#### Comments
```
GET    /photos/:id/comments     List comments for a photo
POST   /photos/:id/comments     Post a comment [Consumer/Creator]
DELETE /comments/:id            Delete own comment
```

#### Ratings
```
POST   /photos/:id/rate         Rate a photo (1-5) [Consumer only]
GET    /photos/:id/rating       Get aggregate rating
```

#### Likes
```
POST   /photos/:id/like         Toggle like on a photo
GET    /photos/:id/likes        Get like count
```

#### Users
```
GET    /users/me                Get own profile
PUT    /users/me                Update profile
GET    /users/:handle           Get public creator profile
GET    /users/:handle/photos    Get creator's photos
```

#### Search
```
GET    /search?q=&tag=&loc=&sort=&page=    Full-text search with filters
```

---

## Database Schema (Azure Cosmos DB — NoSQL)

### Container: `photos`
```json
{
  "id": "uuid",
  "creatorId": "uuid",
  "title": "string",
  "caption": "string",
  "location": { "display": "Venice, Italy", "lat": 45.44, "lng": 12.33 },
  "people": ["@handle1", "@handle2"],
  "tags": ["landscape", "travel"],
  "blobUrl": "https://lumora.blob.core.windows.net/photos/uuid.jpg",
  "cdnUrl":  "https://lumora.azureedge.net/photos/uuid.jpg",
  "thumbnailUrl": "https://lumora.azureedge.net/thumbs/uuid.jpg",
  "likes": 1843,
  "ratingSum": 960,
  "ratingCount": 200,
  "commentCount": 47,
  "createdAt": "2026-04-28T10:32:00Z",
  "_partitionKey": "photo"
}
```

### Container: `users`
```json
{
  "id": "uuid",
  "azureB2CId": "string",
  "name": "string",
  "handle": "@handle",
  "role": "creator | consumer",
  "avatarUrl": "string",
  "bio": "string",
  "followersCount": 0,
  "photoCount": 0,
  "createdAt": "ISO8601",
  "_partitionKey": "user"
}
```

### Container: `comments`
```json
{
  "id": "uuid",
  "photoId": "uuid",
  "authorId": "uuid",
  "text": "string",
  "createdAt": "ISO8601",
  "_partitionKey": "photoId"
}
```

### Container: `likes`
```json
{
  "id": "photoId_userId",
  "photoId": "uuid",
  "userId": "uuid",
  "createdAt": "ISO8601",
  "_partitionKey": "photoId"
}
```

---

## Blob Storage Structure

```
lumora-storage/
├── photos/
│   └── {userId}/
│       └── {photoId}-original.jpg
├── thumbs/
│   └── {userId}/
│       └── {photoId}-thumb.jpg       (Azure Function auto-resize on upload)
│       └── {photoId}-medium.jpg
└── avatars/
    └── {userId}-avatar.jpg
```

**Azure Function trigger:** A Blob-triggered Function runs on every new photo upload to:
1. Resize to 3 sizes (thumbnail 200px, medium 800px, original)
2. Convert to WebP for optimal delivery
3. Write CDN URLs back to Cosmos DB

---

## Scalability Mechanisms

### 1. Azure CDN (Content Delivery Network)
- All images served via Azure CDN edge nodes globally
- Cache-Control headers: `max-age=31536000` for images
- Reduces origin load by ~90% for image requests

### 2. Azure Functions (Serverless)
- Auto-scales from 0 to N instances based on demand
- No idle cost — pay only per execution
- Consumption plan: scales instantly under load

### 3. Cosmos DB Autoscale
- Autoscale provisioned throughput: 100–4000 RU/s
- Global multi-region replication (for production)
- Partition key design ensures even data distribution

### 4. Redis Cache
- Caches: trending tags, popular photo lists, search results
- TTL: 5 minutes for feed data, 1 hour for static aggregates
- Reduces Cosmos DB reads by ~70% for hot queries

### 5. Azure API Management
- Rate limiting: 100 req/min per authenticated user
- Request throttling prevents abuse
- Response caching at gateway level

### 6. Azure Static Web Apps
- Frontend globally distributed via Azure CDN automatically
- No server to manage — pure static serving
- Built-in CI/CD from GitHub Actions

---

## CI/CD Pipeline (Task 1 integration)

```yaml
# .github/workflows/deploy.yml
name: Lumora CI/CD

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Lint HTML/CSS/JS
        run: npx eslint app.js
      - name: Run API tests
        run: npm test
      - name: Deploy Frontend
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_TOKEN }}
          action: "upload"
          app_location: "/"
      - name: Deploy Functions
        uses: Azure/functions-action@v1
        with:
          app-name: lumora-api
          package: ./api
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## Advanced Features (for Distinction criteria)

### 1. Azure Cognitive Services — Image Analysis
- On each upload, Azure Computer Vision API analyses the photo
- Auto-suggests tags based on detected objects/scenes
- Content moderation: blocks inappropriate images before publication
- Generates alt-text for accessibility

### 2. Sentiment Analysis on Comments
- Azure Text Analytics API analyses each new comment
- Negative sentiment triggers review flag for moderation
- Aggregated sentiment score shown per photo (optional display)

### 3. Azure AD B2C Identity Framework
- Full OAuth 2.0 / OpenID Connect authentication
- Creator vs Consumer role enforcement via custom claims
- Social login: Microsoft, Google (configurable)
- JWT tokens validated at API Management gateway

### 4. Media Conversion (Blob-triggered Azure Function)
```python
# api/process_image/__init__.py
import azure.functions as func
from azure.storage.blob import BlobServiceClient
from PIL import Image
import io

def main(blob: func.InputStream, outputBlob: func.Out[bytes]):
    img = Image.open(io.BytesIO(blob.read()))
    # Resize to medium (800px wide, maintain aspect)
    img.thumbnail((800, 800), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='WEBP', quality=85)
    outputBlob.set(buf.getvalue())
```

### 5. CI/CD Pipeline
- GitHub Actions pipeline with lint, test, and deploy stages (see above)

---

## Limitations & Scalability Assessment

| Limitation | Impact | Mitigation Strategy |
|---|---|---|
| Cosmos DB 1000 RU/s free tier | Throttling under heavy load | Enable autoscale; upgrade tier for production |
| Blob Storage egress costs | Cost at scale | CDN absorbs ~90% of requests |
| Redis C0 single-node | No HA for cache | Upgrade to C1 with replication |
| Azure AD B2C 50K MAU free | Limited for large user base | Paid tier scales linearly |
| Function cold starts | ~300ms first request latency | Premium plan with pre-warmed instances |
| No real-time updates | Feed requires manual refresh | Add Azure SignalR for live notifications |

### Scaling Roadmap
1. **Phase 1 (MVP):** Free tier Azure services — supports ~1K MAU
2. **Phase 2 (Growth):** Enable Cosmos DB autoscale, CDN Premium, Redis C1 — supports ~100K MAU
3. **Phase 3 (Scale):** Multi-region Cosmos DB, Azure Front Door global routing, Cosmos DB Gremlin for social graph — supports 1M+ MAU

---

## Local Development

Since the frontend is pure static HTML/CSS/JS, no build step is required.

```bash
# Serve locally with any static server
npx serve .
# or
python -m http.server 3000
```

Open `http://localhost:3000` → use demo login buttons to explore both user roles.

---

## Presentation Slide Outline (Task 3)

| Slide | Content |
|---|---|
| 0 | Title: Lumora · Usman · [Student Number] |
| 1–2 | Problem: Scalable photo distribution; challenges of CDN, storage, auth at scale |
| 3–6 | Technical solution: Architecture diagram, Azure services, API design, DB schema |
| 7–8 | Advanced features: Cognitive Services, CI/CD pipeline, Identity framework |
| 9–10 | Limitations and scalability assessment; roadmap to 1M MAU |
| 11 | 5-minute demo video: creator upload → consumer feed → comments/rating |
| 12 | Concluding comments |
| 13 | References (IEEE format) |

---

## References

[1] Microsoft, "Azure Static Web Apps Documentation," [Online]. Available: https://learn.microsoft.com/azure/static-web-apps  
[2] Microsoft, "Azure Functions Overview," [Online]. Available: https://learn.microsoft.com/azure/azure-functions  
[3] Microsoft, "Azure Cosmos DB Documentation," [Online]. Available: https://learn.microsoft.com/azure/cosmos-db  
[4] Microsoft, "Azure Blob Storage," [Online]. Available: https://learn.microsoft.com/azure/storage/blobs  
[5] Microsoft, "Azure AD B2C," [Online]. Available: https://learn.microsoft.com/azure/active-directory-b2c  
[6] Microsoft, "Azure Cognitive Services," [Online]. Available: https://learn.microsoft.com/azure/cognitive-services  
[7] M. Richards and N. Ford, *Fundamentals of Software Architecture*. O'Reilly Media, 2020.  
[8] "Ulster University Student Guide," [Online]. Available: https://www.ulster.ac.uk/connect/guide
