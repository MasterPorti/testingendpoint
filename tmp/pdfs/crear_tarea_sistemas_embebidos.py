from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

OUT = 'output/pdf/tarea_sistemas_embebidos.pdf'
NAVY = colors.HexColor('#12304A')
TEAL = colors.HexColor('#0D7C86')
GOLD = colors.HexColor('#E5A93D')
PALE = colors.HexColor('#F2F7F8')
INK = colors.HexColor('#263746')
MUTED = colors.HexColor('#607583')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=27, leading=31, textColor=colors.white, alignment=TA_LEFT, spaceAfter=10))
styles.add(ParagraphStyle(name='CoverSub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=17, textColor=colors.HexColor('#D9EEF0')))
styles.add(ParagraphStyle(name='Section', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=NAVY, spaceBefore=11, spaceAfter=7))
styles.add(ParagraphStyle(name='Body2', parent=styles['BodyText'], fontName='Helvetica', fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontName='Helvetica', fontSize=9, leading=12, textColor=MUTED))
styles.add(ParagraphStyle(name='StepTitle', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=12.5, leading=16, textColor=TEAL, spaceAfter=5))
styles.add(ParagraphStyle(name='Hash', parent=styles['BodyText'], fontName='Courier', fontSize=10, leading=14, textColor=NAVY))

def footer(canvas, doc):
    canvas.saveState()
    w, _ = letter
    canvas.setStrokeColor(colors.HexColor('#D7E3E6'))
    canvas.line(0.65 * inch, 0.56 * inch, w - 0.65 * inch, 0.56 * inch)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.68 * inch, 0.36 * inch, 'Actividad de investigación | Sistemas embebidos')
    canvas.drawRightString(w - 0.68 * inch, 0.36 * inch, f'Página {doc.page}')
    canvas.restoreState()

def bullet(text):
    return Paragraph(f'- {text}', styles['Body2'])

story = []
cover = Table([
    [Paragraph('TAREA', styles['CoverSub'])],
    [Paragraph('Sistemas embebidos', styles['CoverTitle'])],
    [Paragraph('Investigación y actividad de aplicación', styles['CoverSub'])],
], colWidths=[7.2 * inch])
cover.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), NAVY), ('LEFTPADDING', (0, 0), (-1, -1), 24), ('RIGHTPADDING', (0, 0), (-1, -1), 24), ('TOPPADDING', (0, 0), (-1, 0), 22), ('BOTTOMPADDING', (0, -1), (-1, -1), 24)]))
story += [cover, Spacer(1, 0.22 * inch)]

info = Table([
    [Paragraph('Nombre del alumno: __________________________________________', styles['Body2']), Paragraph('Fecha: __________________', styles['Body2'])],
    [Paragraph('Grupo: __________________', styles['Body2']), Paragraph('Materia: __________________', styles['Body2'])],
], colWidths=[4.7 * inch, 2.5 * inch])
info.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PALE), ('BOX', (0, 0), (-1, -1), 0.7, colors.HexColor('#D7E3E6')), ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#D7E3E6')), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 12), ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
story += [info, Spacer(1, 0.18 * inch), Paragraph('Propósito', styles['Section']), Paragraph('Investigar los fundamentos de los sistemas embebidos para comprender cómo se integran el hardware y el software en dispositivos diseñados para cumplir una función específica.', styles['Body2']), Paragraph('Indicaciones generales', styles['Section'])]
for x in ['Elabora un documento claro, ordenado y escrito con tus propias palabras.', 'Incluye portada, introducción, desarrollo, conclusión y fuentes consultadas.', 'Puedes incorporar imágenes, diagramas o ejemplos para apoyar tus explicaciones.', 'Extensión sugerida: de 3 a 5 cuartillas, sin contar la portada ni las fuentes.']:
    story.append(bullet(x))
story += [Paragraph('Entrega', styles['Section']), Paragraph('Presenta tu investigación en formato digital y verifica que el texto sea legible, que las fuentes estén completas y que el hash solicitado aparezca al final.', styles['Body2']), PageBreak()]

story += [Paragraph('Paso 1. Investigación', styles['Section']), Paragraph('Investiga y explica los siguientes puntos sobre los sistemas embebidos:', styles['Body2'])]
for x in ['Qué son y cuál es su propósito.', 'Características principales: función específica, recursos limitados, operación en tiempo real, confiabilidad y bajo consumo de energía.', 'Elementos que los componen: microcontrolador o microprocesador, memoria, sensores, actuadores, entradas, salidas y software de control.', 'Diferencias entre un sistema embebido y una computadora de propósito general.', 'Ejemplos de uso en la vida cotidiana y en la industria.', 'Ventajas, limitaciones y retos de diseño.']:
    story.append(bullet(x))

story += [Paragraph('Preguntas guía', styles['Section'])]
qs = [['1', '¿Por qué un sistema embebido suele estar diseñado para una función específica?'], ['2', '¿Qué relación existe entre sensores, actuadores y el programa de control?'], ['3', '¿En qué situaciones es importante que el sistema responda en tiempo real?']]
qt = Table([[Paragraph(f'<b>{n}</b>', styles['Body2']), Paragraph(q, styles['Body2'])] for n, q in qs], colWidths=[0.38 * inch, 6.82 * inch])
qt.setStyle(TableStyle([('BACKGROUND', (0, 0), (0, -1), GOLD), ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#FFF9EC')), ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#E4D4A8')), ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#E4D4A8')), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
story += [qt, Paragraph('Paso 2. Solicitud de hash', styles['Section']), Paragraph('Realiza una petición al siguiente endpoint utilizando tu nombre completo. Después, entrega un documento aparte en formato Markdown (o en otro formato de texto indicado por tu docente) donde respondas las preguntas y coloques el hash al final:', styles['Body2'])]

ep = Table([[Paragraph('<font color="#0D7C86"><b>Endpoint:</b></font> <link href="https://testingendpoint.vercel.app/api/junito-lopez" color="#12304A">https://testingendpoint.vercel.app/api/junito-lopez</link>', styles['Body2'])]], colWidths=[7.2 * inch])
ep.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), PALE), ('BOX', (0, 0), (-1, -1), 0.8, TEAL), ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 12), ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
story += [ep, Spacer(1, 0.18 * inch)]
hb = Table([[Paragraph('Hash recibido:', styles['StepTitle'])], [Paragraph('________________________________________________________________________________', styles['Hash'])]], colWidths=[7.2 * inch])
hb.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#B8CBD0')), ('LEFTPADDING', (0, 0), (-1, -1), 13), ('RIGHTPADDING', (0, 0), (-1, -1), 13), ('TOPPADDING', (0, 0), (-1, 0), 10), ('BOTTOMPADDING', (0, -1), (-1, -1), 13)]))
story += [hb, Spacer(1, 0.18 * inch), Paragraph('Antes de entregar: revisa ortografía, agrega tus fuentes y confirma que el hash se encuentre al final del documento.', styles['Small'])]

doc = SimpleDocTemplate(OUT, pagesize=letter, rightMargin=0.65 * inch, leftMargin=0.65 * inch, topMargin=0.58 * inch, bottomMargin=0.78 * inch, title='Tarea - Sistemas embebidos')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
