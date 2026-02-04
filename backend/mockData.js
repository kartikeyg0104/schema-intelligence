// Mock data for Research Publication Platform

const institutions = [
  { id: '1', name: 'MIT', country: 'USA', type: 'UNIVERSITY', ranking: 1 },
  { id: '2', name: 'Stanford University', country: 'USA', type: 'UNIVERSITY', ranking: 2 },
  { id: '3', name: 'Oxford University', country: 'UK', type: 'UNIVERSITY', ranking: 3 },
  { id: '4', name: 'Google Research', country: 'USA', type: 'COMPANY', ranking: null },
  { id: '5', name: 'Max Planck Institute', country: 'Germany', type: 'RESEARCH_INSTITUTE', ranking: 5 },
];

const departments = [
  { id: '1', name: 'Computer Science', institutionId: '1', headOfDepartmentId: '1' },
  { id: '2', name: 'Physics', institutionId: '1', headOfDepartmentId: '3' },
  { id: '3', name: 'AI Research', institutionId: '2', headOfDepartmentId: '2' },
  { id: '4', name: 'Machine Learning', institutionId: '4', headOfDepartmentId: '4' },
];

const authors = [
  { id: '1', name: 'Dr. Alice Chen', email: 'alice@mit.edu', affiliation: 'MIT', institutionId: '1', hIndex: 45, totalCitations: 12000 },
  { id: '2', name: 'Prof. Bob Williams', email: 'bob@stanford.edu', affiliation: 'Stanford', institutionId: '2', hIndex: 52, totalCitations: 18000 },
  { id: '3', name: 'Dr. Carol Smith', email: 'carol@mit.edu', affiliation: 'MIT', institutionId: '1', hIndex: 38, totalCitations: 8500 },
  { id: '4', name: 'Dr. David Lee', email: 'david@google.com', affiliation: 'Google', institutionId: '4', hIndex: 62, totalCitations: 25000 },
  { id: '5', name: 'Prof. Emma Brown', email: 'emma@oxford.edu', affiliation: 'Oxford', institutionId: '3', hIndex: 41, totalCitations: 9800 },
  { id: '6', name: 'Dr. Frank Miller', email: 'frank@mpg.de', affiliation: 'Max Planck', institutionId: '5', hIndex: 35, totalCitations: 7200 },
];

const coAuthorRelations = {
  '1': ['2', '3'],
  '2': ['1', '4'],
  '3': ['1', '5'],
  '4': ['2', '6'],
  '5': ['3'],
  '6': ['4'],
};

const tags = [
  { id: '1', name: 'Machine Learning', description: 'Research on ML algorithms and applications' },
  { id: '2', name: 'Neural Networks', description: 'Deep learning and neural network architectures' },
  { id: '3', name: 'Natural Language Processing', description: 'NLP and computational linguistics' },
  { id: '4', name: 'Computer Vision', description: 'Image and video analysis' },
  { id: '5', name: 'Reinforcement Learning', description: 'RL algorithms and applications' },
  { id: '6', name: 'Graph Theory', description: 'Mathematical structures and algorithms' },
];

const relatedTagsMap = {
  '1': ['2', '5'],
  '2': ['1', '4'],
  '3': ['1', '2'],
  '4': ['1', '2'],
  '5': ['1'],
  '6': ['1'],
};

const publications = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
    content: 'Full paper content here...',
    publishedDate: '2017-06-12',
    authorIds: ['1', '2'],
    citationIds: [],
    citedByIds: ['2', '3', '4', '5'],
    tagIds: ['1', '2', '3'],
    viewCount: 150000,
    downloadCount: 45000,
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    abstract: 'We introduce a new language representation model called BERT.',
    content: 'Full paper content here...',
    publishedDate: '2018-10-11',
    authorIds: ['4'],
    citationIds: ['1'],
    citedByIds: ['3', '5'],
    tagIds: ['1', '2', '3'],
    viewCount: 120000,
    downloadCount: 38000,
  },
  {
    id: '3',
    title: 'GPT-3: Language Models are Few-Shot Learners',
    abstract: 'Recent work has demonstrated substantial gains on many NLP tasks.',
    content: 'Full paper content here...',
    publishedDate: '2020-05-28',
    authorIds: ['2', '4'],
    citationIds: ['1', '2'],
    citedByIds: ['5'],
    tagIds: ['1', '3'],
    viewCount: 95000,
    downloadCount: 28000,
  },
  {
    id: '4',
    title: 'Deep Residual Learning for Image Recognition',
    abstract: 'Deeper neural networks are more difficult to train.',
    content: 'Full paper content here...',
    publishedDate: '2015-12-10',
    authorIds: ['3', '5'],
    citationIds: ['1'],
    citedByIds: [],
    tagIds: ['1', '2', '4'],
    viewCount: 200000,
    downloadCount: 65000,
  },
  {
    id: '5',
    title: 'Graph Neural Networks: A Review of Methods and Applications',
    abstract: 'Lots of learning tasks require dealing with graph data.',
    content: 'Full paper content here...',
    publishedDate: '2019-07-15',
    authorIds: ['1', '6'],
    citationIds: ['1', '2', '3'],
    citedByIds: [],
    tagIds: ['1', '2', '6'],
    viewCount: 45000,
    downloadCount: 12000,
  },
];

const relatedPublicationsMap = {
  '1': ['2', '3'],
  '2': ['1', '3'],
  '3': ['1', '2', '5'],
  '4': ['1'],
  '5': ['1', '2', '3'],
};

const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', bio: 'PhD student in ML', createdAt: '2023-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', bio: 'Research scientist', createdAt: '2023-02-20' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', bio: 'Software engineer interested in AI', createdAt: '2023-03-10' },
];

const userPublications = {
  '1': ['1', '2'],
  '2': ['3', '4'],
  '3': ['5'],
};

const userFollowedAuthors = {
  '1': ['1', '2', '4'],
  '2': ['2', '3'],
  '3': ['1', '4', '6'],
};

const userSavedPublications = {
  '1': ['1', '3', '5'],
  '2': ['2', '4'],
  '3': ['1', '2', '3'],
};

const comments = [
  { id: '1', content: 'Great paper! Very insightful.', authorId: '1', publicationId: '1', parentCommentId: null, createdAt: '2023-06-15', likes: 45 },
  { id: '2', content: 'I have a question about the attention mechanism.', authorId: '2', publicationId: '1', parentCommentId: null, createdAt: '2023-06-16', likes: 12 },
  { id: '3', content: 'The attention mechanism works by...', authorId: '1', publicationId: '1', parentCommentId: '2', createdAt: '2023-06-17', likes: 8 },
  { id: '4', content: 'Excellent work on BERT!', authorId: '3', publicationId: '2', parentCommentId: null, createdAt: '2023-07-01', likes: 32 },
  { id: '5', content: 'How does this compare to GPT?', authorId: '2', publicationId: '2', parentCommentId: null, createdAt: '2023-07-02', likes: 15 },
];

const userComments = {
  '1': ['1', '3'],
  '2': ['2', '5'],
  '3': ['4'],
};

module.exports = {
  institutions,
  departments,
  authors,
  coAuthorRelations,
  tags,
  relatedTagsMap,
  publications,
  relatedPublicationsMap,
  users,
  userPublications,
  userFollowedAuthors,
  userSavedPublications,
  comments,
  userComments,
};
