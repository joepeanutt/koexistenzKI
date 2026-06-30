// Interviews Page Script

document.addEventListener('DOMContentLoaded', () => {
  const interviews = [
    {
      interviewNumber: 1,
      heading: 'Interview Nummer Eins',
      speaker: 'Dr. Alexander Viehl',
      subheading:
        'Transkript eines Interviews mit Dr. Alexander Viehl (FZI Karlsruhe), geführt am 22.06.2026.',
      context:
        'Im Interview werden diverse Fragen über das Themengebiet der Künstlichen Intelligenz an den Bereichsleiter von "Intelligent Systems and Production Engineering (ISPE)" des FZI, Dr. rer. nat. Alexander Viehl, gestellt.',
      qa: [
        {
          question:
            'Was sehen Sie als größtes Problem mit der Entwicklung von KI heutzutage?',
          answer:
            'Nun, ein großes Problem dieser Entwicklung wäre der große Energieverbrauch, der entsteht. Rechenzentren von großen KIs nehmen unheimlich viel Platz ein und somit auch Strom. Ein ähnliches Beispiel wäre der BTC-Boom: Als das Bitcoin-Mining damals noch sehr groß war, wurden weltweit viele Rechner fürs Mining benutzt, wodurch der Energieverbrauch stark anstieg.'
        },
        {
          question: 'Wo wird KI heutzutage genutzt bzw. integriert?',
          answer:
            'KI wird heute in vielen Bereichen eingesetzt. Beispiele sind Sprachmodelle wie ChatGPT oder Claude, aber auch interne Systeme in Unternehmen. Besonders in Forschung und der Entwicklung intelligenter Hardware spielt KI eine große Rolle. Auch in der Industrie wird KI genutzt, um Prozesse zu verbessern und Fehler zu erkennen. Ein großes Problem ist vor allem der hohe Energieverbrauch solcher Systeme. Die Wasserkühlung, die genutzt wird, um die KI in Betrieb zu halten, verbraucht Riesenmengen an Platz und Energie.'
        },
        {
          question:
            'Wer übernimmt bei Fehlern der KI die Verantwortung und kann man wirklich immer jemanden finden?',
          answer:
            'Das ist eine der schwierigsten Fragen. Eine KI trägt nicht selbst Verantwortung, sondern die Menschen dahinter müssen dafür einstehen. Beim automatisierten Fahren sieht man dieses Problem besonders gut: Die SAE-Level zeigen, wie viel Kontrolle das Fahrzeug übernimmt. Bei niedrigen Stufen (1-3), bei denen der Fahrer ständig eingreifen oder beobachten muss, ist er logischerweise bei Unfällen verantwortlich. Bei höheren Stufen (4-5), bei denen das System das ganze Fahren übernimmt, ist es schwerer einzuordnen. In solchen hohen Stufen wird aber fast immer der Hersteller verantwortlich gehalten.'
        },
        {
          question:
            'Wie empfinden Sie die drastische Entwicklung von Künstlicher Intelligenz in den letzten zwei Jahren?',
          answer:
            'Die Entwicklung ist extrem schnell vorangegangen. KI kann inzwischen viele Aufgaben übernehmen, die früher nur Menschen konnten, wie zum Beispiel das Schreiben von Code oder das Verfassen von E-Mails. Logischerweise gibt es aber immer noch Grenzen, die überschritten werden müssen. Beim Verständnis für die physische Welt scheitert die KI noch sehr oft.'
        },
        {
          question:
            'Finden Sie es sinnvoll oder überhaupt möglich, KI in der Politik einzusetzen?',
          answer:
            'KI kann in der Politik durchaus eingesetzt werden, aber nur mit strenger Regulierung. Hilfreich wäre sie vermutlich dabei, Desinformationen zu erkennen oder Verwaltungsprozesse zu beschleunigen. Ein Beispiel wäre der Einsatz von geprüften Chatbots, die unter anderem auch Reden für Politiker schreiben. Vor allem gibt es wegen diesem Aspekt viel Kritik, und es herrscht Widerstand aus verschiedenen Bereichen. Menschen in der Verwaltung haben beispielsweise Angst, ihre Arbeitsplätze zu verlieren. Das Wichtigste ist immer die Kontrolle: Die KI darf niemals zur Verbreitung von Falschinformationen oder politischer Manipulation genutzt werden.'
        },
        {
          question: 'Ersetzt KI eher Aufgaben oder ganze Berufe?',
          answer:
            'Ich denke, KI wird vorerst einzelne Aufgaben ersetzen statt ganzer Berufe. Es gibt viele repetitive Aufgaben, die durch Künstliche Intelligenz ersetzt werden können. Dadurch gehen Berufe nicht per se verloren, sondern entwickeln sich weiter. Man kann das mit der industriellen Revolution vergleichen: Damals wurden viele manuelle Arbeiten durch Maschinen ersetzt, gleichzeitig entstanden neue Berufe rund um diese Technologien. So ähnlich wird es auch mit KI sein. Menschen werden lernen müssen, wie man mit KI umgeht und wie man sie richtig steuert. Trotzdem darf man nicht unterschätzen, dass manche Berufsfelder stark schrumpfen könnten. Das ist ein zweischneidiges Schwert. Wenn ein Unternehmen viele Mitarbeiter für einfache Datenverarbeitung oder Kundenanfragen benötigt, könnten diese Aufgaben künftig teilweise von KI übernommen werden. Gleichzeitig könnte KI helfen, den Mangel an Arbeitskräften durch die schrumpfende Bevölkerung auszugleichen.'
        },
        {
          question:
            'Kann KI die Chancengleichheit in der Schule zwischen ärmeren und wohlhabenderen Schülern unterstützen?',
          answer:
            'Ja, KI kann durchaus dabei helfen, Bildung zugänglicher zu machen. Ein Schüler könnte mit KI einen persönlichen Lernassistenten haben, der Aufgaben erklärt und beim Lernen unterstützt. Das hilft gegen Unterschiede bei den finanziellen Möglichkeiten. Dafür müssen Schulen aber auch vermitteln, wie man KI richtig nutzt. Wenn nur einige Schüler wissen, wie man solche Systeme effektiv einsetzt, entsteht wieder eine neue Ungleichheit. Wichtig ist also die richtige Belehrung darüber, wie man KI als Schüler benutzen sollte. Die Bildung durch Menschen und Lehrer kann KI wegen ihrer Fehleranfälligkeit aber nicht ersetzen.'
        },
        {
          question:
            'Wie vertrauenswürdig ist Gesichtserkennung durch KI an öffentlichen Orten als Überwachungsmittel?',
          answer:
            'Technisch gesehen ist Gesichtserkennung inzwischen sehr leistungsfähig. KI kann Gesichter mit hoher Genauigkeit erkennen und vergleichen. Man muss sich die ganze Sache jedoch kritisch ansehen. Die größte Gefahr ist die falsche Erkennung von Menschen. Wenn das passiert, kann es zu Fehlurteilen gegenüber Unschuldigen kommen. Auch über die Privatsphäre der Menschen wird bei solchen Angelegenheiten oft diskutiert. Ein Beispiel ist das Social-Credit-System in China: Dabei werden verschiedene Daten über Menschen gesammelt und ausgewertet, unter anderem mithilfe digitaler Überwachungstechnologie. So etwas kann schnell zur kompletten Kontrolle über das Privatleben führen.'
        },
        {
          question:
            'Was passiert mit diesen gesammelten Daten durch die Videoüberwachung? Wie werden sie verwendet?',
          answer:
            'Das hängt stark davon ab, welche Regeln für die Datennutzung gelten. Grundsätzlich werden solche Daten zur Sicherheit genutzt, etwa um Straftaten aufzuklären. Auch wenn Daten nach einer Weile gelöscht werden, besteht die Möglichkeit, dass sie dauerhaft gespeichert oder für andere Zwecke verwendet werden. Solche Gesichtsdaten sind sehr wertvoll für das Training von KI-Modellen. In Europa gibt es durch die DSGVO wenigstens Begrenzungen für die Verwendung persönlicher Daten.'
        }
      ]
    },
    {
      interviewNumber: 2,
      heading: 'Interview Nummer Zwei',
      speaker: 'Herr Schleich',
      subheading:
        'Transkript eines Interviews mit Luis Schleich (SAP) zum Einsatz von KI in Unternehmen.',
      context:
        'Im Rahmen des Projekts wurde Luis Schleich von SAP interviewt. Ziel war, praktische Einblicke in den KI-Einsatz in einem internationalen Unternehmen sowie Chancen und Risiken fuer Gesellschaft, Politik, Bildung und Arbeitswelt zu bekommen.',
      qa: [
        {
          question: 'Was ist das größte Problem bei der Entwicklung von KI?',
          answer:
            'Die größten Herausforderungen bei der Entwicklung von KI sind die Trainingsdaten und die sogenannte Blackbox-Problematik. Eine KI kann nur so gut arbeiten wie die Daten, mit denen sie trainiert wird. Sind diese Daten unvollständig, fehlerhaft oder enthalten Vorurteile, können sich diese direkt auf die Ergebnisse der KI auswirken. Dadurch besteht die Gefahr, dass falsche oder einseitige Entscheidungen getroffen werden. Ein weiteres Problem ist die fehlende Transparenz vieler moderner KI-Systeme. Häufig lässt sich nicht genau nachvollziehen, wie die KI zu einem bestimmten Ergebnis gekommen ist. Gerade in Bereichen, in denen wichtige Entscheidungen getroffen werden, kann dies problematisch sein. Außerdem kann KI die Meinungsbildung von Menschen beeinflussen, etwa durch automatisch erstellte Inhalte oder personalisierte Informationen. Als besonders kritisches Beispiel nannte Herr Schleich autonome Kampfdrohnen, bei denen KI im schlimmsten Fall selbstständig über den Einsatz von Waffen entscheiden könnte. Deshalb sei ein verantwortungsvoller Umgang mit dieser Technologie besonders wichtig.'
        },
        {
          question:
            'Kann KI in Zukunft eine wichtige Rolle in der Politik spielen oder vertrauen die Menschen ihr nicht?',
          answer:
            'KI könnte in Zukunft durchaus eine wichtige Rolle in der Politik übernehmen, beispielsweise indem sie große Datenmengen analysiert oder politische Entscheidungen unterstützt. Damit dies möglich ist, müsste sie jedoch möglichst neutral arbeiten. Genau darin sieht Herr Schleich eine der größten Schwierigkeiten. Da jede KI mit Daten trainiert wird, können sich Vorurteile oder bestimmte Sichtweisen in ihren Ergebnissen widerspiegeln. Bis heute gibt es keine sichere Möglichkeit, solche Verzerrungen vollständig auszuschließen. Deshalb ist es wichtig, dass Menschen die Ergebnisse einer KI immer kritisch hinterfragen und politische Entscheidungen nicht ausschließlich einer künstlichen Intelligenz überlassen.'
        },
        {
          question: 'Wie wird KI bei SAP in den Arbeitsalltag integriert?',
          answer:
            'KI gehört inzwischen fest zum Arbeitsalltag bei SAP und wird in vielen verschiedenen Bereichen eingesetzt. Besonders häufig kommen KI-Programme zum Einsatz, um Texte oder Besprechungen automatisch zusammenzufassen. Dadurch sparen Mitarbeitende Zeit und können sich stärker auf ihre eigentlichen Aufgaben konzentrieren. Herr Schleich machte außerdem deutlich, dass sich in den letzten Jahren bei SAP sehr viel verändert hat. KI entwickelt sich ständig weiter und gewinnt im Unternehmen immer mehr an Bedeutung. Aus diesem Grund investiert SAP intensiv in neue KI-Technologien und sieht in diesem Bereich großes Potenzial für die Zukunft.'
        },
        {
          question: 'Wird KI in Zukunft Berufe ersetzen?',
          answer:
            'KI wird nach seiner Einschätzung den Menschen nicht vollständig ersetzen. Zwar kann generative KI viele Aufgaben übernehmen und dadurch Arbeitsprozesse deutlich vereinfachen, dennoch bleibt der Mensch unverzichtbar. Die Ergebnisse einer KI müssen weiterhin überprüft und bewertet werden. Gerade bei wichtigen Entscheidungen braucht es Menschen, die Verantwortung übernehmen und mögliche Fehler erkennen. Herr Schleich sieht KI deshalb vor allem als Unterstützung für den Menschen und nicht als vollständigen Ersatz.'
        },
        {
          question: 'Kann KI in der Bildung die Chancengleichheit verbessern?',
          answer:
            'Im Bildungsbereich sieht Herr Schleich großes Potenzial. KI kann Schülerinnen und Schüler individuell unterstützen und Lerninhalte an deren Bedürfnisse anpassen. Dadurch könnten viele Lernende den Unterricht besser verstehen und zusätzliche Unterstützung erhalten. Allerdings hängt die Qualität dieser Unterstützung immer von den verwendeten Daten und dem jeweiligen KI-System ab. Deshalb kann KI nicht garantieren, dass alle Menschen vollkommen gleich behandelt werden. Sie kann Lehrkräfte sinnvoll ergänzen und den Unterricht unterstützen, sie jedoch nicht ersetzen.'
        },
        {
          question: 'Wer trägt die Verantwortung für Entscheidungen einer KI?',
          answer:
            'Für Entscheidungen einer KI trägt nicht die KI selbst die Verantwortung, sondern die Unternehmen und Entwickler, die sie programmieren und einsetzen. Sie müssen sicherstellen, dass die Systeme zuverlässig funktionieren und verantwortungsvoll genutzt werden. Vor allem bei sensiblen Anwendungen, beispielsweise im Bereich selbstfahrender Autos oder anderer sicherheitsrelevanter Systeme, sind klare gesetzliche Regelungen und regelmäßige Kontrollen notwendig. Nur so kann gewährleistet werden, dass KI sicher eingesetzt wird und mögliche Risiken möglichst gering bleiben.'
        }
      ]
    }
  ];

  const list = document.getElementById('interview-list');
  if (!list) {
    return;
  }

  interviews.forEach((interview) => {
    const interviewBlock = document.createElement('article');
    interviewBlock.className = 'interview-item interview-block';

    const interviewTitle = document.createElement('h4');
    interviewTitle.className = 'interview-title';
    interviewTitle.textContent = interview.heading;

    const interviewMeta = document.createElement('p');
    interviewMeta.className = 'interview-meta';
    interviewMeta.textContent = interview.subheading;

    const interviewContext = document.createElement('p');
    interviewContext.className = 'interview-context';
    interviewContext.textContent = interview.context;

    const qaList = document.createElement('div');
    qaList.className = 'qa-list';

    interview.qa.forEach((entry, index) => {
      const qaCard = document.createElement('section');
      qaCard.className = 'qa-card';

      const question = document.createElement('h5');
      question.className = 'qa-question';
      question.textContent = `Frage ${index + 1}: ${entry.question}`;

      const answer = document.createElement('p');
      answer.className = 'qa-answer';
      answer.textContent = `${interview.speaker || 'Interviewpartner'}: "${entry.answer}"`;

      qaCard.appendChild(question);
      qaCard.appendChild(answer);
      qaList.appendChild(qaCard);
    });

    interviewBlock.appendChild(interviewTitle);
    interviewBlock.appendChild(interviewMeta);
    interviewBlock.appendChild(interviewContext);
    interviewBlock.appendChild(qaList);
    list.appendChild(interviewBlock);
  });
});
