<template>
  <div>
    <pure-modal v-show="modalOpen" @close="closeModal">
      <div class="pa4">
        <h2 class="tc f2" v-text="`${$t('Forgot your password?')} 💭`"></h2>

        <div class="mt3 mw5 center">
          <pure-input @onEnter="sendMail" @keyup="email = arguments[0]" placeholder="Email"></pure-input>
        </div>

        <div class="mt3 tc">
          <pure-button @click="sendMail" :disabled="!email" v-text="$t('Send recovery email')"></pure-button>
        </div>
      </div>
    </pure-modal>
  </div>
</template>
<script>
  import { sendForgotPasswordMail } from '../../../api/AuthApi'

  export default {
    data () {
      return {
        modalOpen: false,
        email: '',
      }
    },
    methods: {
      openModal () {
        this.modalOpen = true
      },
      closeModal () {
        this.modalOpen = false
      },
      sendMail () {
        sendForgotPasswordMail(this.email)
          .then(() => {
            this.closeModal()
            this.$emit('sentForgotPasswordMail')
          })
          .catch(e => alert(`Could not send mail (${e.message})`))
      },
    },
  }
</script>
