# prototype-selfit

## 실행 방법

```bash
npm install
npm run dev
```

터미널에 나온 주소(예: `http://localhost:5173/`)로 브라우저에서 접속하세요.

### OpenAI Whisper STT 사용 시

Role Play에서 Whisper STT를 쓰려면 **반드시 `npm run dev`로 개발 서버를 띄운 뒤**, 터미널에 출력된 주소로 접속해야 합니다.

- `http://localhost:5173/` 같은 주소는 **개발 서버가 켜져 있을 때만** 동작합니다.
- `npm run dev`를 하지 않고 빌드 결과(`dist`)나 `vite preview`로만 열면 `/api/transcribe`가 없어서 Whisper가 동작하지 않습니다.

`.env`에 `OPENAI_API_KEY=` 값만 넣어 두면, 개발 서버가 Whisper 사용 가능 여부를 자동으로 감지합니다.
