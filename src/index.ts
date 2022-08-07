import "@logseq/libs";
import { Converter } from 'opencc-js';
import type { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";

const aliasKey = "alias"
const simplifiedToTraditional = "s2t"
const traditionalToSimplified = "t2s"

const settingsSchema: SettingSchemaDesc[] = [
  {
    key: "language",
    type: "string",
    title: "Language to use for definitions",
    description: "What language do you want to default to when defining?",
    default: "en",
  },
];

async function main1() {
  await logseq.UI.showMsg("Start Test async function...", "success", { timeout: 400 })
}

const t2sConverter = Converter({ from: 'hk', to: 'cn' });
const s2tConverter = Converter({ from: 'cn', to: 'tw' });

function convertText(inputText: String, mode: String) {
  if (mode === traditionalToSimplified) {
    return t2sConverter(inputText)
  } else if (mode === simplifiedToTraditional) {
    return s2tConverter(inputText)
  } else {
    return inputText
  }
}

const main = async () => {
  logseq.UI.showMsg("Starting...")

  logseq.Editor.registerBlockContextMenuItem("Clear Properties", async (e) => {
    const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
    const targetBlock = pageBlocksTree[0]
    const targetBlockContent = targetBlock.content
    const targetBlockUUID = targetBlock.uuid
    const pageProperties = await logseq.Editor.getBlockProperties(targetBlockUUID)
  })

  logseq.Editor.registerSlashCommand("Log Properties", async () => {
    const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
    const targetBlock = pageBlocksTree[0]
    const targetBlockUUID = targetBlock.uuid
    const pageProperties = await logseq.Editor.getBlockProperties(targetBlockUUID)
  })

  logseq.Editor.registerSlashCommand("Convert To Traditional Chinese", async (e) => {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    const currentBlockUUID = currentBlock!.uuid
    const currentBlockContent = await logseq.Editor.getEditingBlockContent()

    return logseq.Editor.updateBlock(
      currentBlockUUID,
      convertText(currentBlockContent, simplifiedToTraditional)
    )
  })


  logseq.Editor.registerSlashCommand("Convert To Simplified Chinese", async (e) => {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    const currentBlockUUID = currentBlock!.uuid
    const currentBlockContent = await logseq.Editor.getEditingBlockContent()
    return logseq.Editor.updateBlock(
      currentBlockUUID,
      convertText(currentBlockContent, traditionalToSimplified)
    )
  })

  logseq.Editor.registerSlashCommand("Chinese Alias", async (e) => {
    const page = await logseq.Editor.getCurrentPage()
    const pageName = page!.name
    const simplifiedPageName = t2sConverter(pageName)
    const traditionalPageName = s2tConverter(pageName)

    if (simplifiedPageName === traditionalPageName) {
      logseq.UI.showMsg("No new alias needed. (Same character)", "success")
      return
    }

    try {
      const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()

      const targetBlock = pageBlocksTree[0]
      const targetBlockContent = targetBlock.content
      const targetBlockUUID = targetBlock.uuid

      const targetBlockProperties = await logseq.Editor.getBlockProperties(targetBlockUUID)

      if (!targetBlockProperties) {
        await logseq.Editor.upsertBlockProperty(
          targetBlockUUID, aliasKey, []
        )
      }

      if (!targetBlockProperties || Object.keys(targetBlockProperties).length === 0) {
        const chineseAlias = [simplifiedPageName, traditionalPageName]

        await logseq.Editor.upsertBlockProperty(
          targetBlockUUID,
          aliasKey,
          chineseAlias
        )
        logseq.UI.showMsg("Simplified and Traditional Chinese aliases created!", "success")
      } else {
        var existedAlias = targetBlockProperties.alias ? targetBlockProperties.alias : []

        if (existedAlias.indexOf(simplifiedPageName) < 0) {
          existedAlias.push(simplifiedPageName)
        }

        if (existedAlias.indexOf(traditionalPageName) < 0) {
          existedAlias.push(traditionalPageName)
        }

        await logseq.Editor.upsertBlockProperty(
          targetBlockUUID,
          aliasKey,
          existedAlias
        )

        logseq.UI.showMsg("Simplified and Traditional Chinese aliases added!", "success")
      }
    } catch (err: unknown) {
      logseq.UI.showMsg("Alias cannot be added because: " + err, 'warning')
      console.error(err)
    } finally {
      logseq.Editor.exitEditingMode(true)
    }
  })
}

logseq.useSettingsSchema(settingsSchema);
logseq.ready(main).catch(() => console.error);
