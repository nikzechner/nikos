import { NextRequest, NextResponse } from 'next/server';

interface FeedbackData {
  message: string;
  pageContext?: string;
  timestamp: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackData = await request.json();
    const { message, pageContext = 'Dashboard', timestamp, status = 'New' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const notionToken = process.env.NOTION_TOKEN;
    let databaseId = process.env.NOTION_DATABASE_ID;

    // Clean up database ID (remove any trailing % or encoding issues)
    if (databaseId) {
      databaseId = databaseId.replace(/%$/, ''); // Remove trailing %
    }

    console.log('Notion Token exists:', !!notionToken);
    console.log('Database ID exists:', !!databaseId);
    console.log('Database ID:', databaseId);

    if (!notionToken || !databaseId) {
      console.error('Missing Notion configuration');
      return NextResponse.json(
        { error: 'Feedback service not configured' },
        { status: 500 }
      );
    }

    // Create page in Notion database
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
              body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            'Title': {
              title: [
                {
                  text: {
                    content: `Feedback from ${pageContext}`,
                  },
                },
              ],
            },
            'Bug Content': {
              rich_text: [
                {
                  text: {
                    content: message,
                  },
                },
              ],
            },
            'Reported Date': {
              date: {
                start: timestamp,
              },
            },
            'Created by': {
              rich_text: [
                {
                  text: {
                    content: 'Dashboard User', // You can update this to get actual user email if needed
                  },
                },
              ],
            },
            // Temporarily commenting out Status to test
            // 'status': {
            //   select: {
            //     name: 'New',
            //   },
            // },
          },
        }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Notion API error:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { error: `Failed to save feedback to Notion: ${errorData}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Feedback submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 