import styles from "./ConvoHero.module.css";

export function ConvoHero() {
  return (
    <section className={styles.hero} aria-label="Convo instant chat demo">
      <div className="flex flex-col gap-2">
        <h1 className={`${styles.brand} text-4xl uppercase tracking-tight text-center font-black`}>
          CONVO
        </h1>
        <p
          className={`${styles.tagline} text-center text-sm font-bold uppercase tracking-wider text-nb-black/60`}
        >
          Message anyone instantly
        </p>
      </div>

      <div className={styles.demo} aria-hidden="true">
        <div className={styles.searchScene}>
          <div className={styles.searchBox}>
            <span className={styles.searchPrompt}>@</span>
            <span className={styles.typedName}>alex</span>
            <span className={styles.cursor} />
          </div>

          <div className={styles.results}>
            <div className={`${styles.result} ${styles.resultPrimary}`}>
              <div className={styles.avatar}>A</div>
              <div className={styles.meta}>
                <div className={styles.name}>Alex Chen</div>
                <div className={styles.handle}>@alex</div>
              </div>
              <div className={styles.presence}>
                <span className={styles.presenceDot} />
                Online
              </div>
            </div>

            <div className={`${styles.result} ${styles.resultSecondary}`}>
              <div className={styles.avatar}>AR</div>
              <div className={styles.meta}>
                <div className={styles.name}>Alex Rivera</div>
                <div className={styles.handle}>@alexr</div>
              </div>
              <div className={styles.presence}>
                <span className={styles.presenceDot} />
                Online
              </div>
            </div>
          </div>
        </div>

        <div className={styles.chatScene}>
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <div className={styles.chatName}>
                Alex Chen <span className={styles.presenceDot} />
              </div>
              <div className={styles.chatStatus}>Online now</div>
            </div>
            <div className={styles.avatar}>A</div>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.message}>Hey Alex, quick question?</div>
            <div className={styles.reply}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>

          <div className={styles.finalCta}>Start chatting</div>

          <div className={styles.chatInput}>
            <div className={styles.inputText}>Message...</div>
            <div className={styles.sendButton}>Send</div>
          </div>
        </div>
      </div>
    </section>
  );
}
