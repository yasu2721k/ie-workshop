const questions = [
    {
        question: "実際の新築住宅で\n不備や欠陥が見つかる平均数は？",
        image: "images/1.png",
        answers: ["1〜3カ所", "4〜9カ所", "10〜17カ所", "18カ所以上"],
        correctAnswer: 3, // D. 18カ所以上
        answerImage: null // 1問目は画像なし
    },
    {
        question: "この写真の中に耐震性能に関わる欠陥があります。どれが不具合か回答してください",
        image: "images/2.png",
        answers: ["木材の種類が間違っている", "ビスが傾いて締め込まれている", "ビスが規定数より少ない"],
        correctAnswer: 1, // B. ビスが傾いて締め込まれている
        answerImage: "images/2b.png"
    },
    {
        question: "この写真の中に断熱性能に関する欠陥があります。どれが不具合か回答してください",
        image: "images/3.png",
        answers: ["断熱材が不足し空洞になっている", "断熱材の厚さが不足している", "断熱材の種類が間違っている"],
        correctAnswer: 1, // B. 断熱材の厚さが不足している
        answerImage: "images/3b.png"
    },
    {
        question: "この写真の中に防水性能に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/4.png",
        answers: ["1個", "2個", "3個"],
        correctAnswer: 1, // B. 2個
        answerImage: "images/4b.png"
    },
    {
        question: "この写真の中に基礎工事に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/5.png",
        answers: ["使用している鉄筋が規定より細い", "配筋を設置する間隔が広すぎる", "補強筋が入っていない"],
        correctAnswer: 2, // C. 補強筋が入っていない
        answerImage: "images/5b.png"
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
    window.location.hash = 'step1';
    showQuestion();
}

function showQuestion() {
    answered = false;
    const question = questions[currentQuestion];
    
    document.getElementById('question-number').textContent = `${currentQuestion + 1}問目 / ${questions.length}問中`;
    document.getElementById('question-text').textContent = question.question;
    
    const questionImage = document.getElementById('question-image');
    if (question.image && questionImage) {
        // 5問目（最後の質問）の場合は画像を先に読み込んでから表示
        if (currentQuestion === questions.length - 1) {
            const tempImg = new Image();
            tempImg.onload = function() {
                questionImage.src = question.image;
                questionImage.style.display = 'block';
            };
            tempImg.src = question.image;
        } else {
            questionImage.src = question.image;
            questionImage.style.display = 'block';
        }
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
    const questionImage = document.getElementById('question-image');
    
    // 現在のスクロール位置を保存
    const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
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
    
    // 問題画像を回答画像に切り替え（2問目以降）
    if (question.answerImage && questionImage) {
        questionImage.src = question.answerImage;
    }
    
    if (currentQuestion === questions.length - 1) {
        document.getElementById('next-btn').textContent = '結果を見る';
    }
    document.getElementById('next-btn').style.display = 'block';
    
    // 5問目の場合はスクロール位置の維持を強化
    if (currentQuestion === questions.length - 1) {
        // より長い遅延で確実にスクロール位置を維持
        setTimeout(() => {
            window.scrollTo(0, currentScrollPosition);
        }, 50);
        
        // 追加の保険として再度設定
        setTimeout(() => {
            window.scrollTo(0, currentScrollPosition);
        }, 100);
    } else {
        // 通常の質問ではすぐに位置を維持
        setTimeout(() => {
            window.scrollTo(0, currentScrollPosition);
        }, 10);
    }
}

function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion >= questions.length) {
        window.location.hash = 'step6';  // クイズ5問終了後は結果画面（step6）
        showResult();
    } else {
        window.location.hash = `step${currentQuestion + 1}`;  // step2, step3, step4, step5
        showQuestion();
        // 次の質問を表示した後、上部にスクロール
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
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
    window.location.hash = 'step7';  // アンケート1問目
}

// ハウスメーカーリストの表示切り替え
function toggleHouseMakers(element) {
    const houseMakersList = document.getElementById('house-makers-list-10');
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
    const houseMakersList = document.getElementById('house-makers-list-10');
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
        
        // 大手ハウスメーカーが選択されている場合、その詳細も保存
        if (currentInput.value === 'A') {
            const selectedMaker = document.querySelector('input[name="house-maker"]:checked');
            if (!selectedMaker) {
                alert('ハウスメーカーを選択してください');
                return;
            }
            surveyAnswers.houseMaker = [selectedMaker.value];
        }
    } else if (currentPage === 11) {
        surveyAnswers.page11 = currentInput.value;
    }
    
    document.getElementById(`survey-page-${currentPage}`).classList.remove('active');
    
    if (currentPage === 9) {
        // ページ9で新築注文住宅以外を選んだ場合は専用ページへ
        if (surveyAnswers.page9 !== 'A') {
            window.location.hash = 'step-end';  // 対象外の人向けページ
            document.getElementById('survey-non-custom').classList.add('active');
        } else {
            window.location.hash = 'step8';  // アンケート2問目
            document.getElementById('survey-page-10').classList.add('active');
        }
    } else if (currentPage === 10) {
        window.location.hash = 'step9';  // アンケート3問目
        document.getElementById('survey-page-11').classList.add('active');
    } else if (currentPage === 11) {
        // Q3の回答に基づいて分岐
        if (surveyAnswers.page11 === '着工済み' || 
            surveyAnswers.page11 === '完成or引っ越し済み' || 
            surveyAnswers.page11 === '完成or引越し済み') {
            // 着工済み・完成の場合は12Bへ
            showSurveyResult12B();
        } else {
            // 低重要度のハウスメーカーを選択した場合もチェック
            if (surveyAnswers.page10 === 'A' && surveyAnswers.houseMaker) {
                const selectedMaker = surveyAnswers.houseMaker[0];
                const lowMakers = ['一条工務店', 'ミサワホーム', '積水ハウス', 'セキスイハイム', 'トヨタホーム', '大和ハウス工業', 'パナソニック ホームズ', 'へーベルハウス'];
                
                if (lowMakers.includes(selectedMaker)) {
                    // 低重要度メーカーの場合は12Bへ
                    showSurveyResult12B();
                } else {
                    // それ以外は12Aへ
                    showSurveyResult12A();
                }
            } else {
                // それ以外は12Aへ
                showSurveyResult12A();
            }
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
    // ページ10（ハウスメーカー）の回答に基づいてLINEリンクを決定
    let lineUrl = '';
    
    if (surveyAnswers.page10 === 'A' && surveyAnswers.houseMaker) {
        // 大手ハウスメーカーの場合、選択されたメーカーによってリンクを分岐
        const selectedMaker = surveyAnswers.houseMaker[0]; // 最初に選択されたメーカーを使用
        
        const makerLinks = {
            'アイ工務店': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=ldqaZo',
            'アキュラホーム': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=PIG8oj',
            'タマホーム': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=UIpapv',
            'ヤマダホームズ': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=oM850e',
            'クレバリーホーム': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=97cOzs',
            '桧家住宅': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=B0ZcJz',
            '三井ホーム': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=RjEXvy',
            '住友林業': 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=RjEXvy'
        };
        
        lineUrl = makerLinks[selectedMaker] || 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=wwo7k5';
        window.location.hash = 'step11-housemaker';
    } else if (surveyAnswers.page10 === 'B') {
        // 地域の工務店
        window.location.hash = 'step11-local';
        lineUrl = 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=GuoeR4';
    } else {
        // その他
        window.location.hash = 'step11-other';
        lineUrl = 'https://s.lmes.jp/landing-qr/2003392761-9p8BaZdP?uLand=wwo7k5';
    }
    
    const page12a = document.getElementById('survey-page-12a');
    const lineButton = document.getElementById('line-button-12a');
    const lineButtonFooter = document.getElementById('line-button-12a-footer');

    // LINEボタンにクリックイベントを設定
    lineButton.onclick = function() {
        window.open(lineUrl, '_blank');
    };

    // フッターのLINEボタンにも同じリンクを設定
    lineButtonFooter.onclick = function() {
        window.open(lineUrl, '_blank');
    };

    page12a.classList.add('active');
}

// 12Bページの結果を表示
function showSurveyResult12B() {
    // ページ10（ハウスメーカー）の回答に基づいて重要度を決定
    let importance = '中';

    if (surveyAnswers.page10 === 'A' && surveyAnswers.houseMaker) {
        const selectedMaker = surveyAnswers.houseMaker[0];

        // 非常に高い
        const veryHighMakers = ['アイ工務店', 'アキュラホーム', 'タマホーム', 'ヤマダホームズ', 'クレバリーホーム', '桧家住宅'];
        // 高い
        const highMakers = ['三井ホーム', '住友林業'];
        // 低
        const lowMakers = ['一条工務店', 'ミサワホーム', '積水ハウス', 'セキスイハイム', 'トヨタホーム', '大和ハウス工業', 'パナソニック ホームズ', 'へーベルハウス'];

        if (veryHighMakers.includes(selectedMaker)) {
            importance = '非常に高い';
            window.location.hash = 'step-veryhigh';
        } else if (highMakers.includes(selectedMaker)) {
            importance = '高';
            window.location.hash = 'step-high';
        } else if (lowMakers.includes(selectedMaker)) {
            importance = '低';
            window.location.hash = 'step-low';
        } else {
            importance = '中'; // その他のハウスメーカー
            window.location.hash = 'step-middle';
        }
    } else if (surveyAnswers.page10 === 'B') {
        // 地域の工務店
        importance = '高';
        window.location.hash = 'step-high';
    } else if (surveyAnswers.page10 === 'C') {
        // その他
        importance = '中';
        window.location.hash = 'step-middle';
    }

    const page12b = document.getElementById('survey-page-12b');
    const levelElement = page12b.querySelector('.importance-level');
    levelElement.textContent = importance;
    page12b.classList.add('active');
}

// TOPへ戻る機能
function goToTop() {
    // URLハッシュをクリア
    window.location.hash = '';
    
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

// 画像を事前に読み込む関数
function preloadImages() {
    const imagePaths = [
        'images/1.png',
        'images/2.png',
        'images/2b.png',
        'images/3.png',
        'images/3b.png',
        'images/4.png',
        'images/4b.png',
        'images/5.png',
        'images/5b.png'
    ];
    
    imagePaths.forEach(path => {
        const img = new Image();
        img.src = path;
    });
}

// URLハッシュの変更を監視
window.addEventListener('hashchange', function() {
    handleHashChange();
});

// ページ読み込み時のハッシュ処理
function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (!hash || hash === '') {
        // ハッシュがない場合は自動的にクイズを開始
        startQuiz();
        return;
    }

    // step1-5: クイズ画面
    if (hash.match(/^step[1-5]$/)) {
        const stepNumber = parseInt(hash.replace('step', ''));
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('quiz-screen').classList.add('active');
        currentQuestion = stepNumber - 1;
        showQuestion();
        return;
    }

    // step6: 結果画面
    if (hash === 'step6') {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('result-screen').classList.add('active');
        return;
    }

    // step7以降はアンケートページなので、handleHashChangeでは処理しない
    // （nextSurveyPage関数で処理されるため）
    if (hash.startsWith('step') && parseInt(hash.replace('step', '')) >= 7) {
        return; // アンケートページの場合は何もしない
    }
}

window.onload = function() {
    const startScreen = document.getElementById('start-screen');
    const h1 = startScreen.querySelector('h1');
    h1.innerHTML = '簡単60秒!あなたの家は大丈夫？<br>新築不具合事例クイズ';

    // h2要素を削除（不要な場合）
    const existingH2 = startScreen.querySelector('h2');
    if (existingH2) existingH2.remove();

    // ボタンテキストはHTMLで直接設定済み

    // 画像を事前に読み込む
    preloadImages();

    // 初期表示の処理
    handleHashChange();
};