import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { JournalRankings } from "src/scrape";
import { extractText } from "./utils";
import { s } from "vite/dist/node/types.d-aGj9QkWt";

const genAI = new GoogleGenerativeAI("");

export const generateContent = async (
  systemInstruction: string,
  prompt: string
) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction,
    generationConfig: {
      temperature: 1,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return text;
};

export const setToken = (token: string) => {
  genAI.apiKey = token;
};

export type Topic = "경제" | "정치" | string;

export const filterArticles1 = async (
  target: JournalRankings,
  mainTopic: Topic,
  topics: Topic[],
  amount: number
) => {
  const posts = await generateContent(
    `JSON 안에 담겨있는 기사타이틀중 주제가 ${topics.join(
      ", "
    )} 에 관련된 것들을 남기고, 중복되는 기사들은 하나만 남겨 중요한 것들만 선별한뒤 총 ${amount}개로 추려야 합니다 (반드시 ${mainTopic}에 관한 기사에 더 비중을 두어 포함시켜야함). 그 다음 추려진 항목들에 대해 JSON 형식 (title과 link를 구성요소로 가짐)으로 요약하세요.`,
    JSON.stringify(target)
  );

  return posts;
};

interface Candidate {
  content: {
    parts: {
      text: string;
    }[];
    role: string;
  };
  finishReason: string;
  index: number;
  safetyRatings: {
    category: string;
    probability: string;
  }[];
}

interface RootObject {
  candidates: Candidate[];
}

function getText(response: RootObject): string {
  if (response.candidates?.[0].content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts
      .map(({ text }) => text)
      .join("");
  } else {
    return "";
  }
}

export const filterArticles = async (
  token: string,
  json: string,
  mainTopic: Topic,
  topics: Topic[],
  amount: number
) => {
  const joinedTopics = topics.join(", ");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${token}`,
      {
        method: "POST",
        body: `
        {"contents":[{"parts":[{"text":"JSON 안에 담겨있는 기사타이틀중 주제가 ${joinedTopics} 에 관련된 것들을 남기고, 중복되는 기사들은 하나만 남겨 중요한 것들만 선별한뒤 총 ${amount}개로 추려야 합니다 (${mainTopic}에 관한 기사에 더 비중을 두어 포함시켜야함) . 그 다음 추려진 항목들에 대해 JSON 형식 (title과 link를 구성요소로 가짐) 으로 요약하세요. 마지막으로 반드시 JSON 형식만 남기고 설명은 포함하지 않아야 합니다.\n\`\`\`json${json}\`\`\`"}]}],
        "generationConfig": {
          "temperature": 1,
          "topK": 0,
          "topP": 1,
          "maxOutputTokens": 8192,
          "stopSequences": []
        },
        "safetySettings": [
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          }
        ]
      }`,
      }
    );

    const result = await res.json();
    console.log(res);

    const text = extractText(getText(result));

    return text;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const extractWords = async (token: string, contents: string[]) => {
  const joinedContents = contents.join(", ");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${token}`,
      {
        method: "POST",
        body: `
        {"contents":[{"parts":[{"text":"목표: 뉴스 기사에서 독자의 이해를 어렵게 할 수 있는 경제 및 금융 용어를 식별하고 설명합니다.

        대상 독자: 경제 및 금융 분야에 대한 기본적인 지식을 갖춘 일반 대중
        
        출력 형식:
        
        - 기본: 용어, 설명, 일반적인 사용 예시, 영어 번역을 포함합니다.
        - 형식: 반드시 Markdown table 표준으로 작성해야 하고, 사족은 달지 말아야합니다.
        
        필터링 기준:
        
        - 일반적인 경제 용어 (예: GDP, 인플레이션, 주식)는 기사 본문의 주된 내용에 포함되는 문장에 들어가지 않을 경우 제외합니다.
        - 전문적인 경제/금융 용어, 기술적 용어, 또는 업계 전문 용어를 포함합니다.
        
        추가 정보: 필요에 따라 용어의 뉘앙스, 관련 용어와의 관계 등을 설명합니다.
        
        예시:
        
        용어 | 설명 | 사용 예시 | 영어 번역
        ---|---|---|---
        양적완화 | 중앙은행이 경기 부양을 위해 국채 등을 매입하여 시중에 통화량을 늘리는 정책 | 한국은행이 양적완화 정책을 시행하여 시장에 유동성을 공급했다. | Quantitative Easing (QE)
        
        다음은 뉴스 기사입니다:
        ${joinedContents}
        "}]}],
        "generationConfig": {
          "temperature": 1,
          "topK": 0,
          "topP": 0.95,
          "maxOutputTokens": 8192,
          "stopSequences": []
        },
        "safetySettings": [
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          }
        ]}`,
      }
    );

    const result = await res.json();

    const text = getText(result);

    return text;
  } catch (e) {
    console.log(e);
    return null;
  }
};
