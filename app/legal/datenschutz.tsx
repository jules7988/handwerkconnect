import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PRIVACY_CONTENT, PRIVACY_VERSION } from '@/lib/legal';

export default function DatenschutzScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.version}>Version: {PRIVACY_VERSION}</Text>

      {PRIVACY_CONTENT.map((section) => (
        <React.Fragment key={section.title}>
          <Text style={styles.title}>{section.title}</Text>

          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  version: {
    color: '#6b7280',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    marginBottom: 10,
  },
});