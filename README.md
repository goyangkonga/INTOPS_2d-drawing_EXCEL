# 📐 도면 치수 추출기 — Drawing Dimension Extractor

2D PDF 도면을 업로드하면 **Gemini AI**가 치수를 자동 인식·분류하고, 결과를 **Excel 파일**로 다운로드할 수 있는 웹 서비스입니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| PDF 도면 업로드 | 드래그 앤 드롭 또는 파일 선택 |
| AI 치수 추출 | Gemini API로 치수·공차·단위 자동 인식 |
| 결과 편집 | 웹 표에서 직접 수정 가능 |
| Excel 다운로드 | `.xlsx` 파일로 한 번에 저장 |
| 개인 API 키 | 브라우저 localStorage에만 저장 (서버 전송 없음) |

---

## 🚀 로컬 실행

**요구사항:** Node.js 18 이상

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. 패키지 설치
npm install

# 3. 개발 서버 시작
npm run dev
# → http://localhost:5173 접속
```

> 로컬 실행 시에는 브라우저 설정 창에서 API 키를 입력하세요.

---

## 🌐 GitHub Pages 배포

### 방법 1 — GitHub Actions 자동 배포 (권장)

1. 이 저장소를 GitHub에 Push
2. **Settings → Pages → Source** 를 `GitHub Actions` 로 변경
3. `main` 브랜치에 Push하면 자동 빌드 & 배포

### 방법 2 — 수동 배포

```bash
npm run build          # dist/ 폴더 생성
# dist/ 폴더 내용을 gh-pages 브랜치에 push
```

---

## 🔑 Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. **Create API key** 클릭
3. 생성된 키를 사이트 설정(⚙)에서 입력

---

## 📁 프로젝트 구조

```
├── src/
│   ├── App.tsx          # 메인 앱 컴포넌트
│   ├── main.tsx         # 엔트리포인트
│   ├── index.css        # Tailwind CSS
│   └── lib/utils.ts     # 유틸리티 함수
├── .github/workflows/
│   └── deploy.yml       # GitHub Actions 자동 배포
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 📝 라이선스

Apache-2.0
