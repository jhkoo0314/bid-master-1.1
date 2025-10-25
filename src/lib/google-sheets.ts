/**
 * Google Sheets API 유틸리티
 * 서비스 계정을 사용하여 구글 시트에 데이터를 저장합니다.
 */

import { google } from "googleapis";

// Google Sheets 설정
const GOOGLE_SHEET_ID = "1gMVXvwYPcqZnBu2qSA7eH97uBMBVWxdP9A6Kkc0iatw";

// 서비스 계정 정보 (bid-master-v1-sheet.json에서 가져옴)
const serviceAccount = {
  type: "service_account",
  project_id: "bid-master-v1",
  private_key_id: "43be4118b18be54d3ead1e8938d9400719645c61",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyY5aSIwJt8Pwc\nZg7E58jMNwDnCqwiRd7iE9+vcnkYUNB1AGgL1QdeBjuKTc3eCTJGRL2dYoHTn1QL\nzABiVS3NXX22xWFpmmv3xPcQH+uIiOt3RQKqCr+Xe9lF1ZTR1XvyEQSmd3GBAU16\n1OkuVbfvRcuLWr9CGKgJ4qxCiT+JfIFuHW65c1EviocesydcjdMeMV5QMA0yQ7NA\ncaZfyrKplz1RefCHUlEWvTXnaNXYtEj6nI8xulp7ERIHaGK98KxMTP1+rojMYwc9\nqFq9gO2173kul/eD+A78bjMJT5PxL2dm2d9Nhprk5xPHHnzSgHyU8VoiHyJbz5UG\nlzrxBsIjAgMBAAECggEAF45K/bUdxwLBZ8aaQKoSu9Svi9K+9C+hxNy29uX405so\nS6roElfpByNvjU3E14MDXoAJQdUWK6moYX5otpNk3u9vgEkEGfvIMgmSTlDIu1jJ\nLxCvz2Bn+ErkX/JaGnNEUKyqnoi7NjvDzWp7+CBdj3z56cbr5oB3AAcslASnnTHZ\nO9P+ngx+hV4V9V6vnEIuvRGLiAoePfUx3Kb/1msYGrLuORPFHflx1xoTzSyY+SZZ\nt0TbEr6GPAX+JiQLuDIOPcXkND8dgT8Tg9TiLqFPmu9MusMBOsWtxAZEKlgQhkUj\noGGN7ngRq3We5oaFVcvWisP2ZyqAgrTzmRXCYSJmMQKBgQDY3VaEBnhcyrjuulmI\nnfriyo03Q6kjBEWJ02c5DTvYRFzteCM/JXy9+IOXqDVQpCV9GCQqYSNBF1c+eZz3\nGNyXrlOHJU+UmNHqY8NBxYR0CKgvr/qiLogCOGXKBX4B7dH51TYacrySISKXDA+T\ng3JIHQ47YA3hOncXVpb54drh7wKBgQDSlMOIA2jdB0NyEfm/FDCFQ1zm7ZhM684+\nq40Lmg8amAS95IVO0tHaVaniMEe/9kdcUFHeSgFjCCJc7WWau1SdaG17fgNgV2cV\njBVQtwoxuhcUL8H0qte/VGP9UcoH6neUzvUM2xXCX81pBmPu64IJcEyiEUKqWJ7E\nn5KUv8BHDQKBgQDVqVTI5PsHKTAE/JKj2EpL0ZZKQZ5NgrLkdOU5P4GbtNb9nCTV\n3SBGpqc37yEAH4lT80oGewfZ5J4vTnBIvzTvOHDRMQBz/hCrZrkEfw7dp33U5gQA\nb+nOjjQzUy/vxJjhFaCldC+3pW/H87kQ9CvPQtk3xI5IPmsBEm3TKiOV/wKBgBAg\nenUBJde/hafHvqOmjSy3gvbgfUhuyqW8B5o62ytDNyG/zYHC3XVmGBONdQE7gC2O\nrSZj7oVCCzeoqp5V+F3xsGjDtsh7CRb6WmuLCQnT4Y6XNbhiGRG7CclNqTY/+5Z2\n3wd0A8+V/KotZhvXB2dnpUbIIZ3gGZCfU992a+hFAoGBAMnMwhyhLL1JtCNAJgoq\nDLrhL+1u26IqK+J3ojS/7VAtyLmOA3mg7+s9Bxb4EHdcxeBdSCSA5kZQOwrC2AGH\nubuue3J8MmgyVLJnGNibWo1Lissv/pB75cOvuzU5rsOYaRssNXn5xR21JWOBuYeL\nZR753VBnwgRAlI7tDfaBRvv+\n-----END PRIVATE KEY-----\n",
  client_email: "bid-master-db@bid-master-v1.iam.gserviceaccount.com",
  client_id: "114364564145384020827",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/bid-master-db%40bid-master-v1.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

/**
 * Google Sheets API 클라이언트를 초기화합니다.
 */
function initializeSheetsAPI() {
  console.log("🔐 [Google Sheets] API 클라이언트 초기화 중...");

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
    const sheets = initializeSheetsAPI();

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

    // 저장할 데이터 준비
    const values = [[name, email, timestamp]];

    console.log("📝 [Google Sheets] 저장할 데이터:");
    console.log(`  - 이름: ${name}`);
    console.log(`  - 이메일: ${email}`);
    console.log(`  - 신청 시간: ${timestamp}`);

    // 시트에 데이터 추가
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:C", // A열(이름), B열(이메일), C열(시간)
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: values,
      },
    });

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

    // 에러 타입에 따른 메시지 분기
    if (error instanceof Error) {
      if (error.message.includes("PERMISSION_DENIED")) {
        return {
          success: false,
          message:
            "구글 시트 접근 권한이 없습니다. 서비스 계정을 시트에 추가해주세요.",
        };
      } else if (error.message.includes("NOT_FOUND")) {
        return {
          success: false,
          message: "구글 시트를 찾을 수 없습니다. 시트 ID를 확인해주세요.",
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

  try {
    const sheets = initializeSheetsAPI();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:C",
    });

    console.log("✅ [Google Sheets] 데이터 읽기 완료");
    console.log(`  - 읽어온 행 수: ${response.data.values?.length || 0}`);

    return response.data.values;
  } catch (error) {
    console.error("❌ [Google Sheets] 데이터 읽기 실패:", error);
    throw error;
  }
}
