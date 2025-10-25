/**
 * Google Sheets API 유틸리티
 * 서비스 계정을 사용하여 구글 시트에 데이터를 저장합니다.
 */

import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Google Sheets 설정
const GOOGLE_SHEET_ID =
  process.env.GOOGLE_SHEET_ID || "1ZBZ9JVSo6aBWU1VSk0p7LBSCzR8eQTN05jEL4LSyhso";

// 서비스 계정 정보 (새로운 키 파일에서 읽기)
let serviceAccount;
try {
  // 새로운 서비스 계정 키 파일 읽기
  const serviceAccountPath = path.join(
    process.cwd(),
    "bid-master-v1-sheet-mcp.json"
  );
  const serviceAccountData = fs.readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(serviceAccountData);
  console.log("🔑 [Google Sheets] 새로운 서비스 계정 키 로드 완료");
} catch (error) {
  console.error("❌ [Google Sheets] 서비스 계정 키 로드 실패:", error);
  // 폴백: 환경 변수에서 읽기
  serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : {
        type: "service_account",
        project_id: "bid-master-v1",
        private_key_id: "43be4118b18be54d3ead1e8938d9400719645c61",
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyY5aSIwJt8Pwc\nZg7E58jMNwDnCqwiRd7iE9+vcnkYUNB1AGgL1QdeBjuKTc3eCTJGRL2dYoHTn1QL\nzABiVS3NXX22xWFpmmv3xPcQH+uIiOt3RQKqCr+Xe9lF1ZTR1XvyEQSmd3GBAU16\n1OkuVbfvRcuLWr9CGKgJ4qxCiT+JfIFuHW65c1EviocesydcjdMeMV5QMA0yQ7NA\ncaZfyrKplz1RefCHUlEWvTXnaNXYtEj6nI8xulp7ERIHaGK98KxMTP1+rojMYwc9\nqFq9gO2173kul/eD+A78bjMJT5PxL2dm2d9Nhprk5xPHHnzSgHyU8VoiHyJbz5UG\nlzrxBsIjAgMBAAECggEAF45K/bUdxwLBZ8aaQKoSu9Svi9K+9C+hxNy29uX405so\nS6roElfpByNvjU3E14MDXoAJQdUWK6moYX5otpNk3u9vgEkEGfvIMgmSTlDIu1jJ\nLxCvz2Bn+ErkX/JaGnNEUKyqnoi7NjvDzWp7+CBdj3z56cbr5oB3AAcslASnnTHZ\nO9P+ngx+hV4V9V6vnEIuvRGLiAoePfUx3Kb/1msYGrLuORPFHflx1xoTzSyY+SZZ\nt0TbEr6GPAX+JiQLuDIOPcXkND8dgT8Tg9TiLqFPmu9MusMBOsWtxAZEKlgQhkUj\noGGN7ngRq3We5oaFVcvWisP2ZyqAgrTzmRXCYSJmMQKBgQDY3VaEBnhcyrjuulmI\nnfriyo03Q6kjBEWJ02c5DTvYRFzteCM/JXy9+IOXqDVQpCV9GCQqYSNBF1c+eZz3\nGNyXrlOHJU+UmNHqY8NBxYR0CKgvr/qiLogCOGXKBX4B7dH51TYacrySISKXDA+T\ng3JIHQ47YA3hOncXVpb54drh7wKBgQDSlMOIA2jdB0NyEfm/FDCFQ1zm7ZhM684+\nq40Lmg8amAS95IVO0tHaVaniMEe/9kdcUFHeSgFjCCJc7WWau1SdaG17fgNgV2cV\njBVQtwoxuhcUL8H0qte/VGP9UcoH6neUzvUM2xXCX81pBmPu64IJcEyiEUKqWJ7E\nn5KUv8BHDQKBgQDVqVTI5PsHKTAE/JKj2EpL0ZZKQZ5NgrLkdOU5P4GbtNb9nCTV\n3SBGpqc37yEAH4lT80oGewfZ5J4vTnBIvzTvOHDRMQBz/hCrZrkEfw7dp33U5gQA\nb+nOjjQzUy/vxJjhFaCldC+3pW/H87kQ9CvPQtk3xI5IPmsBEm3TKiOV/wKBgBAg\nenUBJde/hafHvqOmjSy3gvbgfUhuyqW8B5o62ytDNyG/zYHC3XVmGBONdQE7gC2O\nrSZj7oVCCzeoqp5V+F3xsGjDtsh7CRb6WmuLCQnT4Y6XNbhiGRG7CclNqTY/+5Z2\n3wd0A8+V/KotZhvXB2dnpUbIIZ3gGZCfU992a+hFAoGBAMnMwhyhLL1JtCNAJgoq\nDLrhL+1u26IqK+J3ojS/7VAtyLmOA3mg7+s9Bxb4EHdcxeBdSCSA5kZQOwrC2AGH\nubuue3J8MmgyVLJnGNibWo1Lissv/pB75cOvuzU5rsOYaRssNXn5xR21JWOBuYeL\nZR753VBnwgRAlI7tDfaBRvv+\n-----END PRIVATE KEY-----\n",
        client_email: "bid-master-db@bid-master-v1.iam.gserviceaccount.com",
        client_id: "114364564145384020827",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/bid-master-db%40bid-master-v1.iam.gserviceaccount.com",
        universe_domain: "googleapis.com",
      };
}

/**
 * Google Sheets API 클라이언트를 초기화합니다.
 */
function initializeSheetsAPI() {
  console.log("🔐 [Google Sheets] API 클라이언트 초기화 중...");
  console.log("🔐 [Google Sheets] 서비스 계정 정보:");
  console.log(`  - 프로젝트 ID: ${serviceAccount.project_id}`);
  console.log(`  - 클라이언트 이메일: ${serviceAccount.client_email}`);
  console.log(`  - 클라이언트 ID: ${serviceAccount.client_id}`);
  console.log(`  - Private Key ID: ${serviceAccount.private_key_id}`);

  try {
    // 서비스 계정으로 인증
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Sheets API 클라이언트 생성
    const sheets = google.sheets({ version: "v4", auth });

    console.log("✅ [Google Sheets] API 클라이언트 초기화 완료");
    return sheets;
  } catch (error) {
    console.error("❌ [Google Sheets] API 클라이언트 초기화 실패:", error);
    console.error("❌ [Google Sheets] 초기화 오류 상세:");
    console.error("  - 오류 타입:", typeof error);
    console.error(
      "  - 오류 메시지:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error) {
      console.error("  - 오류 이름:", error.name);
      console.error("  - 오류 스택:", error.stack);
    }
    throw error;
  }
}

/**
 * 구글 시트에 데이터를 추가합니다.
 * @param name 신청자 이름
 * @param email 신청자 이메일
 * @returns 성공 여부
 */
export async function addWaitlistToSheet(
  name: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  console.log("📊 [Google Sheets] 데이터 저장 시작");
  console.log(`  - 이름: ${name}`);
  console.log(`  - 이메일: ${email}`);
  console.log(`  - 시트 ID: ${GOOGLE_SHEET_ID}`);

  try {
    // API 클라이언트 초기화
    console.log("🔧 [Google Sheets] API 클라이언트 초기화 시작...");
    const sheets = initializeSheetsAPI();
    console.log("✅ [Google Sheets] API 클라이언트 초기화 완료");

    // 신청 시간 생성
    const now = new Date();
    const timestamp = now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // 먼저 시트의 현재 데이터를 확인해보자
    console.log("📖 [Google Sheets] 시트 데이터 확인 중...");
    console.log(`📖 [Google Sheets] 시트 ID: ${GOOGLE_SHEET_ID}`);
    console.log(`📖 [Google Sheets] 범위: Sheet1!A1:C10`);

    try {
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: "A1:C10", // 처음 10행 확인
      });

      console.log("📖 [Google Sheets] 현재 시트 데이터:");
      console.log(`  - 읽어온 행 수: ${readResponse.data.values?.length || 0}`);
      if (readResponse.data.values) {
        readResponse.data.values.forEach((row, index) => {
          console.log(`  - 행 ${index + 1}: ${JSON.stringify(row)}`);
        });
      }
    } catch (readError) {
      console.error("📖 [Google Sheets] 시트 읽기 실패:", readError);
      console.error("📖 [Google Sheets] 읽기 오류 상세:");
      console.error("  - 오류 타입:", typeof readError);
      console.error(
        "  - 오류 메시지:",
        readError instanceof Error ? readError.message : String(readError)
      );
      if (readError instanceof Error) {
        console.error("  - 오류 이름:", readError.name);
        console.error("  - 오류 스택:", readError.stack);
      }

      // 읽기 실패해도 저장은 시도해보자
      console.log("⚠️ [Google Sheets] 읽기 실패했지만 저장은 시도합니다.");
    }

    // 저장할 데이터 준비
    const values = [[name, email, timestamp]];

    console.log("📝 [Google Sheets] 저장할 데이터:");
    console.log(`  - 이름: ${name}`);
    console.log(`  - 이메일: ${email}`);
    console.log(`  - 신청 시간: ${timestamp}`);

    // 시트에 데이터 추가
    console.log("📝 [Google Sheets] API 호출 시작...");
    console.log(`  - 시트 ID: ${GOOGLE_SHEET_ID}`);
    console.log(`  - 범위: Sheet1!A:C`);
    console.log(`  - 데이터: ${JSON.stringify(values)}`);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "A:C", // A열(이름), B열(이메일), C열(시간)
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: values,
      },
    });

    console.log("📝 [Google Sheets] API 응답 받음:");
    console.log(`  - 응답 상태: ${response.status}`);
    console.log(
      `  - 업데이트된 셀: ${response.data.updates?.updatedCells || 0}`
    );
    console.log(
      `  - 업데이트된 행: ${response.data.updates?.updatedRows || 0}`
    );
    console.log(
      `  - 업데이트된 범위: ${response.data.updates?.updatedRange || "없음"}`
    );

    console.log("✅ [Google Sheets] 데이터 저장 완료");
    console.log(
      `  - 업데이트된 셀 수: ${response.data.updates?.updatedCells || 0}`
    );
    console.log(
      `  - 업데이트된 행 수: ${response.data.updates?.updatedRows || 0}`
    );

    return {
      success: true,
      message: "데이터가 성공적으로 저장되었습니다.",
    };
  } catch (error) {
    console.error("❌ [Google Sheets] 데이터 저장 실패:", error);
    console.error("❌ [Google Sheets] 오류 상세 정보:");
    console.error("  - 오류 타입:", typeof error);
    console.error(
      "  - 오류 메시지:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "  - 오류 스택:",
      error instanceof Error ? error.stack : "스택 없음"
    );

    // 추가 디버깅 정보
    if (error && typeof error === "object") {
      console.error("  - 오류 객체 키들:", Object.keys(error));
      if ("code" in error) {
        console.error("  - 오류 코드:", (error as any).code);
      }
      if ("status" in error) {
        console.error("  - HTTP 상태:", (error as any).status);
      }
      if ("response" in error) {
        console.error("  - 응답 데이터:", (error as any).response?.data);
      }
    }

    // 에러 타입에 따른 메시지 분기
    if (error instanceof Error) {
      console.error("  - 오류 이름:", error.name);

      if (error.message.includes("PERMISSION_DENIED")) {
        console.error("  - 권한 거부 오류 감지");
        return {
          success: false,
          message:
            "구글 시트 접근 권한이 없습니다. 서비스 계정을 시트에 추가해주세요.",
        };
      } else if (error.message.includes("NOT_FOUND")) {
        console.error("  - 시트를 찾을 수 없음 오류 감지");
        return {
          success: false,
          message: "구글 시트를 찾을 수 없습니다. 시트 ID를 확인해주세요.",
        };
      } else if (error.message.includes("INVALID_ARGUMENT")) {
        console.error("  - 잘못된 인수 오류 감지");
        return {
          success: false,
          message: "구글 시트 요청 형식이 잘못되었습니다.",
        };
      }
    }

    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }
}

/**
 * 구글 시트의 데이터를 읽어옵니다. (테스트용)
 * @returns 시트 데이터
 */
export async function readSheetData(): Promise<any> {
  console.log("📖 [Google Sheets] 데이터 읽기 시작");
  console.log(`📖 [Google Sheets] 시트 ID: ${GOOGLE_SHEET_ID}`);

  try {
    const sheets = initializeSheetsAPI();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "A:C",
    });

    console.log("✅ [Google Sheets] 데이터 읽기 완료");
    console.log(`  - 읽어온 행 수: ${response.data.values?.length || 0}`);

    return response.data.values;
  } catch (error) {
    console.error("❌ [Google Sheets] 데이터 읽기 실패:", error);
    console.error("❌ [Google Sheets] 읽기 오류 상세:");
    console.error("  - 오류 타입:", typeof error);
    console.error(
      "  - 오류 메시지:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error) {
      console.error("  - 오류 이름:", error.name);
      console.error("  - 오류 스택:", error.stack);
    }
    throw error;
  }
}
