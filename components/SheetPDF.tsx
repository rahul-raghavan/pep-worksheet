import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Question } from '../lib/generate';

const A4_WIDTH = 595.28; // pt
const A4_HEIGHT = 841.89; // pt
const MARGIN = 40; // pt
const HEADER_HEIGHT = 32; // pt
const FOOTER_HEIGHT = 24; // pt
const BODY_FONT_SIZE = 12; // pt
const HEADER_FONT_SIZE = 14; // pt
const FOOTER_FONT_SIZE = 10; // pt
const LINE_HEIGHT = 1.3;

export interface SheetPDFProps {
  title: string;
  generatedOn: string; // ISO date
  questions: Question[];
  mode: 'problems' | 'answers';
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    width: A4_WIDTH,
    height: A4_HEIGHT,
    padding: MARGIN,
  },
  header: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: HEADER_FONT_SIZE,
    marginBottom: 16,
  },
  list: {
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  item: {
    fontSize: BODY_FONT_SIZE,
    marginBottom: 0, // adaptive
    lineHeight: BODY_FONT_SIZE * LINE_HEIGHT,
  },
  answer: {
    fontSize: BODY_FONT_SIZE,
    color: '#444',
    marginTop: 2,
    marginLeft: 16,
  },
  footer: {
    position: 'absolute',
    bottom: MARGIN,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: FOOTER_FONT_SIZE,
    color: '#888',
  },
});

export const SheetPDF: React.FC<SheetPDFProps> = ({ title, generatedOn, questions, mode }) => {
  // Calculate adaptive spacing
  const qCount = questions.length;
  const pageBodyHeight = A4_HEIGHT - 2 * MARGIN - HEADER_HEIGHT - FOOTER_HEIGHT;
  const lineHeight = BODY_FONT_SIZE * LINE_HEIGHT;
  const totalLinesHeight = qCount * lineHeight;
  const spacing = Math.max(8, (pageBodyHeight - totalLinesHeight) / (qCount + 1));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{title}</Text>
        <View style={styles.list}>
          {questions.map((q, i) => (
            <View key={q.id} style={{ marginBottom: spacing }}>
              <Text style={styles.item}>
                {i + 1}. {q.Front}
              </Text>
              {mode === 'answers' && (
                <Text style={styles.answer}>{q.Back}</Text>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.footer}>
          Generated on: {generatedOn.slice(0, 10)}
        </Text>
      </Page>
    </Document>
  );
}; 