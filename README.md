# prototype-selfit

## 실행 방법

```bash
npm install
npm run dev
```

터미널에 나온 주소(예: `http://localhost:5173/`)로 브라우저에서 접속하세요.

### Gemini STT·Chat 사용 시 (무료 한도)

Chat·STT 모두 **Gemini API 무료 한도**로 사용할 수 있습니다. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키를 발급하면 됩니다.

Role Play / Real Talk에서 Gemini STT(음성→텍스트)와 Cathy 대화를 쓰려면 **반드시 `npm run dev`로 개발 서버를 띄운 뒤**, 터미널에 출력된 주소로 접속하세요.

- `http://localhost:5173/` 같은 주소는 **개발 서버가 켜져 있을 때만** 동작합니다.
- `npm run dev`를 하지 않고 빌드 결과(`dist`)나 `vite preview`로만 열면 `/api/transcribe`, `/api/chat`이 없어서 Gemini STT·Chat이 동작하지 않습니다.

`.env`에 `GEMINI_API_KEY=` 값을 넣어 두면, 개발 서버가 Gemini 사용 가능 여부를 자동으로 감지합니다.

**Web Speech API(브라우저 음성 인식)** 는 Chrome/Edge에서만 지원되며, Safari 등에서는 동작하지 않을 수 있습니다. 키 없이 쓰려다 음성 인식이 안 되면 화면에 "GEMINI_API_KEY를 설정해 주세요" 안내가 뜹니다.
