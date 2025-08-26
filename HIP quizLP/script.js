const questions = [
    {
        question: "実際の新築住宅で\n不備や欠陥が見つかる平均数は？",
        image: "images/1.png",
        answers: ["1〜3カ所", "4〜9カ所", "10〜17カ所", "18カ所以上"],
        correctAnswer: 3 // D. 18カ所以上
    },
    {
        question: "この写真の中に耐震性能に関わる欠陥があります。どれが不具合か回答してください",
        image: "images/2.png",
        answers: ["木材の種類が間違っている", "ビスが傾いて締め込まれている", "ビスが規定量より少ない"],
        correctAnswer: 1 // B. ビスが傾いて締め込まれている
    },
    {
        question: "この写真の中に断熱性能に関する欠陥があります。どれが不具合か回答してください",
        image: "images/3.png",
        answers: ["断熱材が不足し空洞になっている", "断熱材の厚さが不足している", "断熱材の種類が間違っている"],
        correctAnswer: 1 // B. 断熱材の厚さが不足している
    },
    {
        question: "この写真の中に防水性能に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/4.png",
        answers: ["1個", "2個", "3個"],
        correctAnswer: 1 // B. 2個
    },
    {
        question: "この写真の中に基礎工事に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/5.png",
        answers: ["使用している鉄筋が規定より細い", "配筋を設置する間隔が広すぎる", "補強筋が入っていない"],
        correctAnswer: 2 // C. 補強筋が入っていない
    }
];

let currentQuestion = 0;
let score = 0;
let answered = false;

function startQuiz() {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');
    currentQuestion = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    answered = false;
    const question = questions[currentQuestion];
    
    document.getElementById('question-number').textContent = `${currentQuestion + 1}問目 / ${questions.length}問中`;
    document.getElementById('question-text').textContent = question.question;
    
    const questionImage = document.getElementById('question-image');
    if (question.image && questionImage) {
        questionImage.src = question.image;
        questionImage.style.display = 'block';
    } else if (questionImage) {
        questionImage.style.display = 'none';
    }
    
    updateProgressDots();
    
    // 回答ボタンを動的に生成
    const answerButtonsContainer = document.getElementById('answer-buttons');
    answerButtonsContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.onclick = () => selectAnswer(index);
        answerButtonsContainer.appendChild(button);
    });
    
    document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
    document.getElementById('next-btn').style.display = 'none';
}

function updateProgressDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index < currentQuestion) {
            dot.classList.add('completed');
        } else if (index === currentQuestion) {
            dot.classList.add('active');
        }
    });
}

function selectAnswer(answerIndex) {
    if (answered) return;
    
    answered = true;
    const question = questions[currentQuestion];
    const answerButtons = document.querySelectorAll('.answer-btn');
    const feedbackElement = document.getElementById('feedback');
    
    answerButtons.forEach(button => button.disabled = true);
    
    if (answerIndex === question.correctAnswer) {
        score++;
        answerButtons[answerIndex].classList.add('correct');
        feedbackElement.textContent = '正解です！';
        feedbackElement.classList.add('show', 'correct');
    } else {
        answerButtons[answerIndex].classList.add('incorrect');
        answerButtons[question.correctAnswer].classList.add('correct');
        feedbackElement.textContent = '不正解です。正解は「' + question.answers[question.correctAnswer] + '」でした。';
        feedbackElement.classList.add('show', 'incorrect');
    }
    
    if (currentQuestion === questions.length - 1) {
        document.getElementById('next-btn').textContent = '結果を見る';
    }
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion >= questions.length) {
        showResult();
    } else {
        showQuestion();
    }
}

function showResult() {
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('result-screen').classList.add('active');
    
    const percentage = Math.round((score / questions.length) * 100);
    
    document.getElementById('score-text').textContent = `${questions.length}問中${score}問正解`;
    document.getElementById('percentage-number').textContent = percentage;
}

function restartQuiz() {
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
}

// アンケート関連の変数
let surveyAnswers = {
    page9: null,
    page10: null,
    page11: null,
    houseMaker: null
};

// アンケートを開始
function startSurvey() {
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('survey-page-9').classList.add('active');
}

// ハウスメーカーリストの表示切り替え
function toggleHouseMakers(element) {
    const houseMakersList = document.getElementById('house-makers-list');
    const radioInput = element.querySelector('input[type="radio"]');
    
    // ラジオボタンを選択
    radioInput.checked = true;
    
    // ハウスメーカーリストを表示
    houseMakersList.style.display = 'block';
    
    // スムーズなアニメーション
    setTimeout(() => {
        houseMakersList.style.maxHeight = houseMakersList.scrollHeight + 'px';
    }, 10);
}

// ハウスメーカーリストを非表示
function hideHouseMakers() {
    const houseMakersList = document.getElementById('house-makers-list');
    houseMakersList.style.display = 'none';
    
    // ラジオボタンをリセット
    const radios = houseMakersList.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => radio.checked = false);
}

// 次のアンケートページへ
function nextSurveyPage(currentPage) {
    // 現在のページの回答を保存
    const currentInput = document.querySelector(`input[name="q${currentPage}-1"]:checked`);
    if (!currentInput) {
        alert('回答を選択してください');
        return;
    }
    
    if (currentPage === 9) {
        surveyAnswers.page9 = currentInput.value;
    } else if (currentPage === 10) {
        surveyAnswers.page10 = currentInput.value;
        
        // ハウスメーカーが選択されている場合、その詳細も保存
        if (currentInput.value === 'A') {
            const selectedMaker = document.querySelector('input[name="house-maker"]:checked');
            surveyAnswers.houseMaker = selectedMaker ? selectedMaker.value : null;
        }
    } else if (currentPage === 11) {
        surveyAnswers.page11 = currentInput.value;
    }
    
    document.getElementById(`survey-page-${currentPage}`).classList.remove('active');
    
    if (currentPage === 9) {
        document.getElementById('survey-page-10').classList.add('active');
    } else if (currentPage === 10) {
        document.getElementById('survey-page-11').classList.add('active');
    } else if (currentPage === 11) {
        // ページ9でB,Cを選んだ人は回答に関わらず12Bへ
        if (surveyAnswers.page9 === 'B' || surveyAnswers.page9 === 'C') {
            showSurveyResult12B();
        } 
        // ページ11の回答に基づいて分岐
        else if (surveyAnswers.page11 === '着工済み' || 
            surveyAnswers.page11 === '完成or引っ越し済み' || 
            surveyAnswers.page11 === '完成or引越し済み') {
            // 着工済み・完成の場合は12Bへ
            showSurveyResult12B();
        } else {
            // それ以外は12Aへ
            showSurveyResult12A();
        }
    }
}

// 前のアンケートページへ
function prevSurveyPage(currentPage) {
    document.getElementById(`survey-page-${currentPage}`).classList.remove('active');
    
    if (currentPage === 10) {
        document.getElementById('survey-page-9').classList.add('active');
    } else if (currentPage === 11) {
        document.getElementById('survey-page-10').classList.add('active');
    }
}

// 12Aページの結果を表示
function showSurveyResult12A() {
    // ページ9の回答に基づいてLINEリンクタイプを決定
    let linkType = 'DEFAULT';
    if (surveyAnswers.page9 === 'A') {
        linkType = 'TYPE_A';
    } else if (surveyAnswers.page9 === 'D') {
        linkType = 'TYPE_B';
    }
    
    const page12a = document.getElementById('survey-page-12a');
    // ここでlinkTypeに応じて異なるLINEリンクを設定可能
    // 現在は同じリンクを使用
    page12a.classList.add('active');
}

// 12Bページの結果を表示
function showSurveyResult12B() {
    // ページ9の回答に基づいて重要度を決定
    let importance = '中';
    if (surveyAnswers.page9 === 'A') {
        importance = '高';
    } else if (surveyAnswers.page9 === 'B' || surveyAnswers.page9 === 'C') {
        importance = '低';
    } else if (surveyAnswers.page9 === 'D') {
        importance = '中';
    }
    
    const page12b = document.getElementById('survey-page-12b');
    const levelElement = page12b.querySelector('.importance-level');
    levelElement.textContent = importance;
    page12b.classList.add('active');
}

// TOPへ戻る機能
function goToTop() {
    // すべての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // スタート画面を表示
    document.getElementById('start-screen').classList.add('active');
    // クイズの状態をリセット
    currentQuestion = 0;
    score = 0;
    answered = false;
    // アンケートの回答もリセット
    surveyAnswers = {
        page9: null,
        page10: null,
        page11: null,
        houseMaker: null
    };
}

window.onload = function() {
    const startScreen = document.getElementById('start-screen');
    const h1 = startScreen.querySelector('h1');
    h1.innerHTML = '簡単3分！クイズで分かる<br>"後悔しない家づくり"';
    
    // h2要素を削除（不要な場合）
    const existingH2 = startScreen.querySelector('h2');
    if (existingH2) existingH2.remove();
    
    // ボタンテキストはHTMLで直接設定済み
};