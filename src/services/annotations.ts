// Private annotation system — stored in localStorage, never exported or searched

export interface Annotation {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

// Item annotations
export function getItemAnnotations(itemId: string): Annotation[] {
  try {
    return JSON.parse(localStorage.getItem(`ichub_annotations_item_${itemId}`) || '[]');
  } catch { return []; }
}

export function saveItemAnnotations(itemId: string, annotations: Annotation[]): void {
  localStorage.setItem(`ichub_annotations_item_${itemId}`, JSON.stringify(annotations));
}

export function addItemAnnotation(itemId: string, text: string): Annotation {
  const annotations = getItemAnnotations(itemId);
  const a: Annotation = { id: `ann-${Date.now()}`, text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  annotations.push(a);
  saveItemAnnotations(itemId, annotations);
  return a;
}

export function editItemAnnotation(itemId: string, annId: string, text: string): void {
  const annotations = getItemAnnotations(itemId).map(a =>
    a.id === annId ? { ...a, text, updatedAt: new Date().toISOString() } : a
  );
  saveItemAnnotations(itemId, annotations);
}

export function deleteItemAnnotation(itemId: string, annId: string): void {
  saveItemAnnotations(itemId, getItemAnnotations(itemId).filter(a => a.id !== annId));
}

// Topic annotations
export function getTopicAnnotations(topicId: string): Annotation[] {
  try {
    return JSON.parse(localStorage.getItem(`ichub_annotations_topic_${topicId}`) || '[]');
  } catch { return []; }
}

export function saveTopicAnnotations(topicId: string, annotations: Annotation[]): void {
  localStorage.setItem(`ichub_annotations_topic_${topicId}`, JSON.stringify(annotations));
}

export function addTopicAnnotation(topicId: string, text: string): Annotation {
  const annotations = getTopicAnnotations(topicId);
  const a: Annotation = { id: `ann-${Date.now()}`, text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  annotations.push(a);
  saveTopicAnnotations(topicId, annotations);
  return a;
}

export function editTopicAnnotation(topicId: string, annId: string, text: string): void {
  const annotations = getTopicAnnotations(topicId).map(a =>
    a.id === annId ? { ...a, text, updatedAt: new Date().toISOString() } : a
  );
  saveTopicAnnotations(topicId, annotations);
}

export function deleteTopicAnnotation(topicId: string, annId: string): void {
  saveTopicAnnotations(topicId, getTopicAnnotations(topicId).filter(a => a.id !== annId));
}
