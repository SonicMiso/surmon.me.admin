import React from 'react'
import { useShallowRef, useReactive, useComputed } from 'veact'
import { useLoading } from 'veact-use'
import { Button, Row, Divider, Modal, Checkbox, Flex, Typography } from 'antd'
import * as Icons from '@ant-design/icons'
import * as api from '@/apis/system'
import { getAllArticles } from '@/apis/article'
import { Article, ArticlePublic, ArticlePublish } from '@/constants/article'
import { UniversalEditor, UnEditorLanguage } from '@/components/common/UniversalEditor'

export const ActionsForm: React.FC = () => {
  const databaseUpdating = useLoading()
  const archiveUpdating = useLoading()

  const updateDatabaseBackup = () => {
    Modal.confirm({
      centered: true,
      title: '更新备份会导致强制覆盖旧的数据库备份，确定要继续吗？',
      onOk: () => databaseUpdating.promise(api.updateDatabaseBackup())
    })
  }

  const updateArchiveCache = () => {
    Modal.confirm({
      centered: true,
      title: '将会更新全站的所有全量数据缓存，确定要继续吗？',
      onOk: () => archiveUpdating.promise(api.updateArchiveCache())
    })
  }

  const articlesData = useShallowRef<Article[]>([])
  const articlesLoading = useLoading()
  const articlesState = useReactive({
    modalOpened: false,
    publicOnly: true
  })

  const filteredArticles = useComputed(() => {
    if (articlesState.publicOnly) {
      return articlesData.value.filter((a) => {
        return a.state === ArticlePublish.Published && a.public === ArticlePublic.Public
      })
    } else {
      return articlesData.value
    }
  })

  const filteredArticlesJsonString = useComputed(() => {
    return JSON.stringify(filteredArticles.value, null, 2)
  })

  const handleArticlesPublicOnlyChange = (value: boolean) => {
    articlesState.publicOnly = value
  }

  const openExportArticlesModal = async () => {
    articlesState.modalOpened = true
    articlesState.publicOnly = true
    articlesData.value = await articlesLoading.promise(getAllArticles())
  }

  const closeExportArticlesModal = () => {
    articlesState.modalOpened = false
    articlesData.value = []
  }

  return (
    <Row>
      <Button
        type="primary"
        block={true}
        loading={databaseUpdating.state.value}
        onClick={updateDatabaseBackup}
        icon={<Icons.CloudUploadOutlined />}
      >
        立即更新数据库备份
      </Button>
      <Divider />
      <Button
        type="primary"
        block={true}
        loading={archiveUpdating.state.value}
        onClick={updateArchiveCache}
        icon={<Icons.CloudSyncOutlined />}
      >
        更新 Archive 及缓存
      </Button>
      <Divider />
      <Button
        block={true}
        onClick={openExportArticlesModal}
        icon={<Icons.CloudDownloadOutlined />}
      >
        导出全量文章数据
      </Button>
      <Modal
        title="全量文章数据"
        width="70%"
        footer={null}
        maskClosable={false}
        loading={articlesLoading.state.value}
        open={articlesState.modalOpened}
        onCancel={closeExportArticlesModal}
      >
        <Divider />
        <Flex justify="space-between">
          <Checkbox
            checked={articlesState.publicOnly}
            onChange={(event) => handleArticlesPublicOnlyChange(event.target.checked)}
          >
            仅保留公开文章数据（State = Published; Public = Public）
          </Checkbox>
          <Typography.Text strong={articlesState.publicOnly} disabled={!articlesState.publicOnly}>
            已过滤 {articlesData.value.length - filteredArticles.value.length} 条非公开数据
          </Typography.Text>
        </Flex>
        <Divider />
        <UniversalEditor
          rows={24}
          value={filteredArticlesJsonString.value}
          eid="app-export-all-articles"
          placeholder="全站全量文章数据"
          disbaled={true}
          defaultLanguage={UnEditorLanguage.JSON}
          disabledLanguageSelect={true}
          disabledCacheDraft={true}
          disabledLineNumbers={true}
        />
      </Modal>
    </Row>
  )
}
