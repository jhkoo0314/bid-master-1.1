#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// 환경변수 로더 함수
function loadEnvironmentVariables() {
  console.log("🔧 [MCP] 환경변수 로드 시작");

  // 1. 프로젝트 루트의 .env.local 시도
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    console.log("📁 [MCP] .env.local 파일 발견, 로드 중...");
    require("dotenv").config({ path: envLocalPath });
  }

  // 2. .env 시도
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    console.log("📁 [MCP] .env 파일 발견, 로드 중...");
    require("dotenv").config({ path: envPath });
  }

  console.log("✅ [MCP] 환경변수 로드 완료");
}

// 구글 서비스 계정 정보 로드
function loadGoogleCredentials() {
  console.log("🔑 [MCP] 구글 서비스 계정 로드 시작");

  // 1순위: 환경변수에서 JSON 직접 읽기
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log("🔑 [MCP] 환경변수에서 구글 키 로드");
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  // 2순위: 환경변수에서 파일 경로 읽기
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const filePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log(`📁 [MCP] 파일에서 구글 키 로드: ${filePath}`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  }

  // 3순위: 기본 파일 시도
  const defaultPath = path.join(process.cwd(), "bid-master-v1-sheet-mcp.json");
  if (fs.existsSync(defaultPath)) {
    console.log(`📁 [MCP] 기본 파일에서 구글 키 로드: ${defaultPath}`);
    const data = fs.readFileSync(defaultPath, "utf8");
    return JSON.parse(data);
  }

  // 4순위: 하드코딩된 키 사용 (현재 프로젝트용)
  console.log("🔑 [MCP] 하드코딩된 구글 키 사용");
  return {
    type: "service_account",
    project_id: "bid-master-v1",
    private_key_id: "8c75751a1847b602aca6a95afd682d60e7be74d6",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCTmry/j1hpO/Xk\nPKybchaz4gkKf41idb3BihyV0quzQkG44Z2159mNWE51ONhwIRl+pGzRKdzjezHr\ncsx0L79dh5GUHMVwZWWuirV5U/irlE5oYA9ga+DbyWIhJPWplleyDF7oeGfUTELB\nuX+8zZBaXBGC6NN96sOzvMpP8jWvakbw9Yf+ssqITv1aNSd9GLuuUCEmcaQTtDpm\n1jaRW7JM1Rd4a+BoJjqpswSFUv/ejwh2cxXYGpsT26YJ6Fe8ozIuNThHXA+V0b4J\nfBmTsYEkCEJwjUaAVnjxduIdMBr8Lo/qrEx7uOaJ8I7eEnkEIdeSetkrfI33jH+5\n1JT7KztrAgMBAAECggEADoYEuXKQ1/Xy6WzA7SCqNDPzAMnxLvV34OHGk0Vh6KcF\n0Xu9qWbxRJOiUK1xuoK/P/NM073jQqzeChVHIc2K7liHDgRQtxD7EtQKLDCDgNp8\nZo/BI5Mp0mZ71dgNpgypf1bxRb2HNd/1F5u5gmnVoNZ7UJ65JKQjcn2KiJhECQjt\nMeoOH1PEmqoZ1DWSJgE5/xBt+N89+7Xee0AYlibDmdLuK2uQOwIcaQ7vPbWGyiiP\nddlpHZFHjWVNRFWBNnEBKsfYAVk8/dWikbAOwu0CSo90dgjlJFIbxvKwCrJleKpx\nPmQCsP43RUG4bGNLyrq4gQDSKqpLY8PE71zR/FfYgQKBgQDPPO0VOAFBomCBbVT8\nKmByzOT35F/gfw+OxBNDwZb+HpifhqLgMP+tuJ5gxegWnh4MZ1iz76itXv1tsApv\nGqt6kkN2tfmh1bB0LLaL7Smcc7fw1a0rnifLGzuWNnLh//BSAV+srJCb7D4DP6p5\nMIRQCaB4Lj9cs8/dcUCAmGI2gQKBgQC2VcHmyCCEN2LXsoquyKvHh3aX0/620bnr\n9qmgfE6Mk8P7Wse5d/xQWqWW1v0BC0UxFK+X1xSwuL6X4bTgtv/kFKtHXcQTO8my\nN/m4U+f5/AzKJuFUJBfEzPGEGZ228sIqbPioQ9Y+Ibeju1GAq1H5AXdNiYR9bNG0\nzEUu/2ez6wKBgGq/eWf6pzsFxywkAyi5M2EvBapjKrfa+0qQ2VOHfp17aSaTFYbh\n9nGnrX0vtDMiU1wUR+63vm0/hs9fZKCCXl4OxU16wxGHnxLYjVdaXJrISLF3f3H+\nT4Uhi/n+JgMf8MxtBLlPUlXexLqrqsYuJZmMu+nr+Jtpy+LHGXCkDcMBAoGBAImK\nDwYjGEQj8295wpstzEZqrM7Cn3UQpwqTukjQ+/+Wx1Mnm1kQZUfH2Pj7m0XaVos7\na2lCWN0lvr+bBnIsGMLXxIvE807+3pqNFtYwlOBBfPRQd9CcmUFexyA6onmKjWSr\nZram1Ulw7bGYb1Z75Q3MSU432bUzDM0w+U8GYheZAoGBALZXMhMsZ9Ov11vtnYmq\n5OhbFxRb84Xx2Kw/j4sRg0wsUCmYzdIOA167zEpnYlOcMg1TL/yTbsRB8TzUmZkf\nzaapalUDtZ9mNypOOArp0UmuVZPtgXzZHvugNco6DlLSaq77ExKVfS7B1WUsGsic\nCGzqqoMsVGOmOS7h1BAv4muL\n-----END PRIVATE KEY-----\n",
    client_email: "bid-master-db@bid-master-v1.iam.gserviceaccount.com",
    client_id: "114364564145384020827",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/bid-master-db%40bid-master-v1.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  };
}

// 구글 시트 ID 로드
function loadGoogleSheetId() {
  return (
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    "1ZBZ9JVSo6aBWU1VSk0p7LBSCzR8eQTN05jEL4LSyhso"
  );
}

// 구글 시트 API 클라이언트 초기화
function initializeSheetsAPI() {
  console.log("🔐 [MCP] 구글 시트 API 클라이언트 초기화 중...");

  const serviceAccount = loadGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  console.log("✅ [MCP] 구글 시트 API 클라이언트 초기화 완료");

  return sheets;
}

class GoogleSheetsServer extends Server {
  constructor() {
    super({
      name: "google-sheets-server",
      version: "1.0.0",
    });

    this.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "read_sheet",
          description: "구글 시트의 데이터를 읽어옵니다",
          inputSchema: {
            type: "object",
            properties: {
              range: {
                type: "string",
                description: "읽을 범위 (예: A1:C10, 기본값: A:C)",
                default: "A:C",
              },
            },
          },
        },
        {
          name: "append_row",
          description: "구글 시트에 새로운 행을 추가합니다 (사전 알림용)",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "이름" },
              email: { type: "string", description: "이메일" },
            },
            required: ["name", "email"],
          },
        },
        {
          name: "update_cell",
          description: "구글 시트의 특정 셀을 업데이트합니다",
          inputSchema: {
            type: "object",
            properties: {
              range: {
                type: "string",
                description: "업데이트할 셀 범위 (예: A1)",
              },
              value: { type: "string", description: "입력할 값" },
            },
            required: ["range", "value"],
          },
        },
        {
          name: "get_sheet_info",
          description: "구글 시트의 기본 정보를 확인합니다",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ];

      return { tools };
    });

    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "read_sheet": {
            const range = (args as any)?.range || "A:C";
            console.log(`📖 [MCP] 시트 데이터 읽기: ${range}`);

            const sheets = initializeSheetsAPI();
            const sheetId = loadGoogleSheetId();

            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: sheetId,
              range: range,
            });

            const data = response.data.values || [];
            console.log(`✅ [MCP] 시트 읽기 완료: ${data.length}행`);

            return {
              content: [
                {
                  type: "text",
                  text: `구글 시트 데이터 (${data.length}행):\n${JSON.stringify(
                    data,
                    null,
                    2
                  )}`,
                },
              ],
            };
          }

          case "append_row": {
            const { name: userName, email } = args as any;
            console.log(`📝 [MCP] 행 추가: ${userName}, ${email}`);

            const sheets = initializeSheetsAPI();
            const sheetId = loadGoogleSheetId();

            const now = new Date();
            const timestamp = now.toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            const values = [[userName, email, timestamp]];

            const response = await sheets.spreadsheets.values.append({
              spreadsheetId: sheetId,
              range: "A:C",
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: {
                values: values,
              },
            });

            console.log(
              `✅ [MCP] 행 추가 완료: ${
                response.data.updates?.updatedRows || 0
              }행`
            );

            return {
              content: [
                {
                  type: "text",
                  text: `행 추가 성공: ${userName} (${email}) - ${timestamp}`,
                },
              ],
            };
          }

          case "update_cell": {
            const { range, value } = args as any;
            console.log(`✏️ [MCP] 셀 업데이트: ${range} = ${value}`);

            const sheets = initializeSheetsAPI();
            const sheetId = loadGoogleSheetId();

            const response = await sheets.spreadsheets.values.update({
              spreadsheetId: sheetId,
              range: range,
              valueInputOption: "RAW",
              requestBody: {
                values: [[value]],
              },
            });

            console.log(`✅ [MCP] 셀 업데이트 완료: ${range}`);

            return {
              content: [
                {
                  type: "text",
                  text: `셀 업데이트 성공: ${range} = ${value}`,
                },
              ],
            };
          }

          case "get_sheet_info": {
            console.log(`ℹ️ [MCP] 시트 정보 확인`);

            const sheetId = loadGoogleSheetId();
            const serviceAccount = loadGoogleCredentials();

            return {
              content: [
                {
                  type: "text",
                  text: `구글 시트 정보:
- 시트 ID: ${sheetId}
- 프로젝트 ID: ${serviceAccount.project_id}
- 서비스 계정: ${serviceAccount.client_email}
- 상태: 연결됨`,
                },
              ],
            };
          }

          default:
            throw new Error(`알 수 없는 도구: ${name}`);
        }
      } catch (error) {
        console.error(`❌ [MCP] 오류:`, error);
        return {
          content: [
            {
              type: "text",
              text: `오류 발생: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    });
  }
}

async function main() {
  console.log("🚀 [MCP] 구글 시트 MCP 서버 시작");

  // 환경변수 로드
  loadEnvironmentVariables();

  const server = new GoogleSheetsServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.log("✅ [MCP] 구글 시트 MCP 서버 연결됨");
}

main().catch((error) => {
  console.error("❌ [MCP] 서버 시작 실패:", error);
  process.exit(1);
});
