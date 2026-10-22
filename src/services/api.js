export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ============================================================
// GET JWT TOKEN
// ============================================================

function getToken() {
    return localStorage.getItem("token");
}

// ============================================================
// SIMPLE IN-MEMORY GET CACHE
// ============================================================
// Cleared automatically after CACHE_TTL_MS, or manually via clearApiCache().
// Avoids hammering the backend when the same GET fires repeatedly
// (e.g. switching tabs back and forth on a dashboard).

const CACHE_TTL_MS = 15000; // 15 seconds
const getCache = new Map();

function getCacheKey(endpoint) {
    return endpoint;
}

export function clearApiCache(endpoint) {
    if (endpoint) {
        getCache.delete(endpoint);
    } else {
        getCache.clear();
    }
}

// ============================================================
// RETRY HELPER
// ============================================================
// Retries only on network failure or 5xx server errors — never on
// 4xx, since retrying a bad request or invalid input won't help.

const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
    return status >= 500 && status < 600;
}

// ============================================================
// COMMON API REQUEST
// ============================================================

export async function apiRequest(
    endpoint,
    options = {}
) {

    const {
        retries = DEFAULT_RETRIES,
        useCache = false,
        ...fetchOptions
    } = options;

    // Serve from cache if this is a cache-eligible GET
    if (useCache) {
        const cached = getCache.get(getCacheKey(endpoint));
        if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(fetchOptions.headers || {}),
    };

    // Add JWT if available
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {

        let response;

        try {
            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...fetchOptions,
                    headers,
                }
            );
        } catch (networkError) {
            // fetch itself threw — offline, DNS failure, server unreachable, etc.
            lastError = new Error(
                "Network error. Please check your connection and try again."
            );

            if (attempt < retries) {
                await sleep(RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            throw lastError;
        }

        // ========================================================
        // READ RESPONSE
        // ========================================================

        let data = null;

        const contentType =
            response.headers.get("content-type");

        if (
            contentType &&
            contentType.includes("application/json")
        ) {
            data = await response.json();
        }

        // ========================================================
        // UNAUTHORIZED
        // ========================================================

        if (response.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login";

            throw new Error(
                "Session expired. Please login again."
            );
        }

        // ========================================================
        // FORBIDDEN
        // ========================================================

        if (response.status === 403) {

            throw new Error(
                "You are not authorized to perform this action."
            );
        }

        // ========================================================
        // RETRYABLE SERVER ERROR (5xx)
        // ========================================================

        if (isRetryableStatus(response.status) && attempt < retries) {
            lastError = new Error(
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`
            );
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
        }

        // ========================================================
        // OTHER ERRORS (non-retryable, or retries exhausted)
        // ========================================================

        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}`
            );
        }

        // Success — cache it if requested
        if (useCache) {
            getCache.set(getCacheKey(endpoint), {
                data,
                time: Date.now(),
            });
        }

        return data;
    }

    throw lastError;
}

// ============================================================
// GET
// ============================================================
// Pass { useCache: true } to cache this GET for 15s, or
// { retries: 0 } to disable retry for a specific call.

export function get(endpoint, options = {}) {

    return apiRequest(endpoint, {
        method: "GET",
        ...options,
    });
}

// ============================================================
// POST
// ============================================================

export function post(endpoint, body, options = {}) {

    return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        ...options,
    });
}

// ============================================================
// PUT
// ============================================================

export function put(endpoint, body, options = {}) {

    const result = apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(body),
        ...options,
    });

    clearApiCache(); // any write can make cached GETs stale
    return result;
}

// ============================================================
// DELETE
// ============================================================

export function remove(endpoint, options = {}) {

    const result = apiRequest(endpoint, {
        method: "DELETE",
        ...options,
    });

    clearApiCache(); // any write can make cached GETs stale
    return result;
}