# vue-smartview (배포본)

웹 화면의 UI 프레임워크 vue-smartview 의 배포본(`dist/`)이다. 원본 저장소는 공개하지 않고, 화면이 쓰는 요소(`web/src/elements.ts`의 import)만 담은 부분 빌드(원본 `npm run build:subset`)를 둔다. 다른 요소를 `register()`로 등록하면 "이 부분 빌드에 없다" 오류가 난다.

- 출처: VUE-SMARTVIEW 저장소의 커밋 `SOURCE_COMMIT`
- 라이선스: 이 저장소의 [LICENSE](../../../LICENSE) (MIT). `dist/`에 함께 번들된 제3자 라이브러리(Vue, Vuetify, vue-i18n, CodeMirror, d3, DOMPurify, Material Design Icons 폰트)는 각자의 라이선스를 따른다
- 이 폴더의 파일은 직접 고치지 않는다. 화면에 요소를 더하거나 원본을 갱신하면 `scripts/update-smartview.sh <원본 체크아웃>`으로 다시 만든다 (원본에 커밋되지 않은 변경이 있으면 멈춘다)
