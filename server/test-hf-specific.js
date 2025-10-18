require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function testHFModels() {
  console.log('🧪 Testing HuggingFace with different approaches...');
  
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log('❌ No HuggingFace API key');
    return;
  }
  
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  
  // Try sentiment analysis (usually works)
  try {
    console.log('Testing sentiment analysis...');
    const sentiment = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: 'I love this AI service!'
    });
    console.log('✅ Sentiment Analysis:', sentiment[0]);
  } catch (error) {
    console.log('❌ Sentiment failed:', error.message);
  }
  
  // Try summarization
  try {
    console.log('Testing summarization...');
    const summary = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: 'The quick brown fox jumps over the lazy dog. This is a simple test sentence for summarization.',
      parameters: {
        max_length: 20
      }
    });
    console.log('✅ Summarization:', summary.summary_text);
  } catch (error) {
    console.log('❌ Summarization failed:', error.message);
  }
  
  // Try question answering
  try {
    console.log('Testing question answering...');
    const qa = await hf.questionAnswering({
      model: 'deepset/roberta-base-squad2',
      inputs: {
        question: 'What is HuggingFace?',
        context: 'HuggingFace is a company that provides tools for natural language processing and machine learning.'
      }
    });
    console.log('✅ Question Answering:', qa.answer);
  } catch (error) {
    console.log('❌ QA failed:', error.message);
  }
}

testHFModels();