#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { URL } from "url";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api";
const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

// Google OAuth2 Client
let oauth2Client = null;
let accessToken = null;
let idToken = null;

// Initialize OAuth2 Client
async function initializeOAuth() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have a saved token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      oauth2Client.setCredentials(token);
      accessToken = token.access_token;
      idToken = token.id_token;

      // Set up token refresh
      oauth2Client.on("tokens", (tokens) => {
        if (tokens.refresh_token) {
          token.refresh_token = tokens.refresh_token;
        }
        token.access_token = tokens.access_token;
        token.id_token = tokens.id_token;
        accessToken = tokens.access_token;
        idToken = tokens.id_token;
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      });

      console.error("Google authentication loaded from saved token");
    } else {
      console.error("No saved token found. Authentication required.");
      await authenticateUser();
    }
  } catch (error) {
    console.error("Error initializing OAuth:", error.message);
    throw error;
  }
}

// Authenticate user via OAuth flow
async function authenticateUser() {
  return new Promise((resolve, reject) => {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      // Add other scopes your API needs
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    console.error("\nAuthorize this app by visiting this URL:");
    console.error(authUrl);

    // Open browser automatically
    open(authUrl).catch(() => {
      console.error("Could not open browser automatically. Please open the URL manually.");
    });

    // Create a local server to receive the OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://localhost:8080");

        if (url.pathname === "/oauth2callback") {
          const code = url.searchParams.get("code");

          if (code) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("<h1>Authentication successful!</h1><p>You can close this window and return to Claude.</p>");

            // Exchange code for tokens
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            accessToken = tokens.access_token;
            idToken = tokens.id_token;

            // Save tokens
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            console.error("Authentication successful! Token saved.");
            console.error("ID Token received:", idToken ? "Yes" : "No");

            server.close();
            resolve();
          } else {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end("<h1>Authentication failed</h1><p>No code received.</p>");
            server.close();
            reject(new Error("No authorization code received"));
          }
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>Error</h1><p>" + error.message + "</p>");
        server.close();
        reject(error);
      }
    });

    server.listen(8080, () => {
      console.error("Waiting for authentication on http://localhost:8080/oauth2callback");
    });
  });
}

// Ensure we have a valid access token
async function ensureValidToken() {
  if (!oauth2Client) {
    await initializeOAuth();
  }

  // Check if token is expired
  if (oauth2Client.credentials.expiry_date &&
    oauth2Client.credentials.expiry_date < Date.now()) {
    console.error("Token expired, refreshing...");
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    accessToken = credentials.access_token;
    idToken = credentials.id_token;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
  }

  return idToken; // Return ID token instead of access token
}

const server = new Server(
  {
    name: "local-api-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      oauth: {  // Add this
        providers: ["google"]
      }
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_products",
        description: "Retrieve all products from the local API",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_customers",
        description: "Retrieve all customers from the local API",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_product_by_id",
        description: "Retrieve a specific product by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The product ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_customer_by_id",
        description: "Retrieve a specific customer by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The customer ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "create_product",
        description: "Create a new product",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Product name",
            },
            price: {
              type: "number",
              description: "Product price",
            },
          },
          required: ["name", "price"],
        },
      },
      {
        name: "update_product",
        description: "Update an existing product",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The product ID",
            },
            name: {
              type: "string",
              description: "Updated product name",
            },
            price: {
              type: "number",
              description: "Updated product price",
            },
          },
          required: ["id", "name", "price"],
        },
      },
      {
        name: "create_customer",
        description: "Create a new customer",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Customer name",
            },
            email: {
              type: "string",
              description: "Customer email",
            },
          },
          required: ["name", "email"],
        },
      },
      {
        name: "update_customer",
        description: "Update an existing customer",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The customer ID",
            },
            name: {
              type: "string",
              description: "Updated customer name",
            },
            email: {
              type: "string",
              description: "Updated customer email",
            },
          },
          required: ["id", "name", "email"],
        },
      },
      {
        name: "get_billings",
        description: "Retrieve all billings from the local API",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_billing_by_id",
        description: "Retrieve a specific billing by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The billing ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "create_billing",
        description: "Create a new billing record",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "number",
              description: "Product ID",
            },
            customerId: {
              type: "number",
              description: "Customer ID",
            },
            total: {
              type: "number",
              description: "Billing total amount",
            },
          },
          required: ["productId", "customerId", "total"],
        },
      },
      {
        name: "delete_billing",
        description: "Delete a billing record",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The billing ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "get_total_revenue",
        description: "Get total revenue from all billings",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_sales_by_product",
        description: "Get sales grouped by product",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_sales_by_customer",
        description: "Get sales grouped by customer",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure we have a valid token before making API calls
    const token = await ensureValidToken();

    let url;
    let method = "GET";
    let body = null;

    switch (name) {
      case "get_products":
        url = `${API_BASE_URL}/product`;
        break;
      case "get_customers":
        url = `${API_BASE_URL}/customer`;
        break;
      case "get_product_by_id":
        url = `${API_BASE_URL}/product/${args.id}`;
        break;
      case "get_customer_by_id":
        url = `${API_BASE_URL}/customer/${args.id}`;
        break;
      case "create_product":
        url = `${API_BASE_URL}/product`;
        method = "POST";
        body = JSON.stringify({ name: args.name, price: args.price });
        break;
      case "update_product":
        url = `${API_BASE_URL}/product/${args.id}`;
        method = "PUT";
        body = JSON.stringify({ id: args.id, name: args.name, price: args.price });
        break;
      case "create_customer":
        url = `${API_BASE_URL}/customer`;
        method = "POST";
        body = JSON.stringify({ name: args.name, email: args.email });
        break;
      case "update_customer":
        url = `${API_BASE_URL}/customer/${args.id}`;
        method = "PUT";
        body = JSON.stringify({ id: args.id, name: args.name, email: args.email });
        break;
      case "get_billings":
        url = `${API_BASE_URL}/billing`;
        break;
      case "get_billing_by_id":
        url = `${API_BASE_URL}/billing/${args.id}`;
        break;
      case "create_billing":
        url = `${API_BASE_URL}/billing`;
        method = "POST";
        body = JSON.stringify({ productId: args.productId, customerId: args.customerId, total: args.total });
        break;
      case "delete_billing":
        url = `${API_BASE_URL}/billing/${args.id}`;
        method = "DELETE";
        break;
      case "get_total_revenue":
        url = `${API_BASE_URL}/report/total-revenue`;
        break;
      case "get_sales_by_product":
        url = `${API_BASE_URL}/report/sales-by-product`;
        break;
      case "get_sales_by_customer":
        url = `${API_BASE_URL}/report/sales-by-customer`;
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Add Google token to headers
      },
    };

    if (body) {
      options.body = body;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Initialize OAuth before starting the server
  // await initializeOAuth();

  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Local API MCP server running on stdio with Google authentication");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});