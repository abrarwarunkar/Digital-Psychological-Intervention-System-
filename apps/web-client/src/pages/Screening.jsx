import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed",
    "Thoughts that you would be better off dead, or of hurting yourself"
];

const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen"
];

const Screening = () => {
    const [type, setType] = useState('PHQ9');
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const questions = type === 'PHQ9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

    const handleAnswer = (index, value) => {
        setAnswers(prev => ({
            ...prev,
            [index]: parseInt(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(answers).length !== questions.length) {
            alert('Please answer all questions');
            return;
        }

        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qid, answer]) => ({
                qid: parseInt(qid),
                answer
            }));

            await api.post('/screening', {
                type,
                answers: formattedAnswers
            });

            navigate('/');
        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit screening');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-100">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Mental Health Screening</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => { setType('PHQ9'); setAnswers({}); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${type === 'PHQ9' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        PHQ-9 (Depression)
                    </button>
                    <button
                        onClick={() => { setType('GAD7'); setAnswers({}); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${type === 'GAD7' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        GAD-7 (Anxiety)
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {questions.map((q, index) => (
                    <div key={index} className="border-b border-slate-100 pb-6 last:border-0">
                        <p className="text-slate-800 font-medium mb-3">{index + 1}. {q}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((option, val) => (
                                <label
                                    key={val}
                                    className={`
                    flex flex-col items-center justify-center p-3 rounded cursor-pointer border transition-all
                    ${answers[index] === val
                                            ? 'bg-teal-50 border-primary text-primary'
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}
                  `}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${index}`}
                                        value={val}
                                        checked={answers[index] === val}
                                        onChange={(e) => handleAnswer(index, e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm text-center">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary text-white px-8 py-3 rounded-md hover:bg-teal-800 transition-colors font-medium disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Screening'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Screening;
