/**
 * 간단한 테스트 API - 구글 시트 없이 로컬 파일에 저장
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  console.log("🧪 [간단 테스트] 시작");

  try {
    const body = await request.json();
    const { name, email } = body;

    console.log(`🧪 [간단 테스트] 데이터: ${name}, ${email}`);

    // 로컬 파일에 저장
    const data = {
      name,
      email,
      timestamp: new Date().toISOString(),
    };

    const filePath = path.join(process.cwd(), "waitlist-data.json");

    // 기존 데이터 읽기
    let existingData = [];
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      existingData = JSON.parse(fileContent);
    } catch (error) {
      // 파일이 없으면 빈 배열로 시작
      existingData = [];
    }

    // 새 데이터 추가
    existingData.push(data);

    // 파일에 저장
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    console.log("🧪 [간단 테스트] 로컬 파일 저장 완료");

    return NextResponse.json({
      success: true,
      message: "로컬 파일에 저장 완료",
      data: data,
      totalRecords: existingData.length,
    });
  } catch (error) {
    console.error("🧪 [간단 테스트] 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "테스트 실패",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
