const {
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
} = require('./mockData');

const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(u => u.id === id),
    publications: () => publications,
    publication: (_, { id }) => publications.find(p => p.id === id),
    authors: () => authors,
    author: (_, { id }) => authors.find(a => a.id === id),
    institutions: () => institutions,
    institution: (_, { id }) => institutions.find(i => i.id === id),
    tags: () => tags,
    searchPublications: (_, { query }) => 
      publications.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.abstract.toLowerCase().includes(query.toLowerCase())
      ),
  },

  User: {
    publications: (user) => {
      const pubIds = userPublications[user.id] || [];
      return publications.filter(p => pubIds.includes(p.id));
    },
    comments: (user) => {
      const commentIds = userComments[user.id] || [];
      return comments.filter(c => commentIds.includes(c.id));
    },
    followedAuthors: (user) => {
      const authorIds = userFollowedAuthors[user.id] || [];
      return authors.filter(a => authorIds.includes(a.id));
    },
    savedPublications: (user) => {
      const pubIds = userSavedPublications[user.id] || [];
      return publications.filter(p => pubIds.includes(p.id));
    },
  },

  Publication: {
    authors: (pub) => authors.filter(a => pub.authorIds.includes(a.id)),
    citations: (pub) => publications.filter(p => pub.citationIds.includes(p.id)),
    citedBy: (pub) => publications.filter(p => pub.citedByIds.includes(p.id)),
    tags: (pub) => tags.filter(t => pub.tagIds.includes(t.id)),
    comments: (pub) => comments.filter(c => c.publicationId === pub.id),
    relatedPublications: (pub) => {
      const relatedIds = relatedPublicationsMap[pub.id] || [];
      return publications.filter(p => relatedIds.includes(p.id));
    },
  },

  Author: {
    institution: (author) => institutions.find(i => i.id === author.institutionId),
    publications: (author) => publications.filter(p => p.authorIds.includes(author.id)),
    coAuthors: (author) => {
      const coAuthorIds = coAuthorRelations[author.id] || [];
      return authors.filter(a => coAuthorIds.includes(a.id));
    },
  },

  Institution: {
    authors: (inst) => authors.filter(a => a.institutionId === inst.id),
    departments: (inst) => departments.filter(d => d.institutionId === inst.id),
    publications: (inst) => {
      const instAuthors = authors.filter(a => a.institutionId === inst.id);
      const authorIds = instAuthors.map(a => a.id);
      return publications.filter(p => p.authorIds.some(aid => authorIds.includes(aid)));
    },
  },

  Department: {
    institution: (dept) => institutions.find(i => i.id === dept.institutionId),
    authors: (dept) => authors.filter(a => a.institutionId === dept.institutionId),
    headOfDepartment: (dept) => authors.find(a => a.id === dept.headOfDepartmentId),
  },

  Comment: {
    author: (comment) => users.find(u => u.id === comment.authorId),
    publication: (comment) => publications.find(p => p.id === comment.publicationId),
    replies: (comment) => comments.filter(c => c.parentCommentId === comment.id),
    parentComment: (comment) => comments.find(c => c.id === comment.parentCommentId),
  },

  Tag: {
    publications: (tag) => publications.filter(p => p.tagIds.includes(tag.id)),
    relatedTags: (tag) => {
      const relatedIds = relatedTagsMap[tag.id] || [];
      return tags.filter(t => relatedIds.includes(t.id));
    },
  },
};

module.exports = resolvers;
